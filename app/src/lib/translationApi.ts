interface AiLanguageDetection {
  detectedLanguage?: string;
  language?: string;
  confidence?: number;
}

interface AiLanguageDetector {
  detect(input: string): Promise<AiLanguageDetection[] | AiLanguageDetection>;
  destroy?: () => void;
}

interface AiLanguageDetectorFactory {
  create?: () => Promise<AiLanguageDetector>;
}

interface AiTranslator {
  translate(input: string): Promise<string> | string;
  destroy?: () => void;
}

interface AiTranslatorFactory {
  canTranslate?: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<boolean | "no" | "readily" | "after-download">;
  create?: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<AiTranslator>;
}

interface BrowserAi {
  languageDetector?: AiLanguageDetectorFactory;
  translator?: AiTranslatorFactory;
}

function getBrowserAi(): BrowserAi | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const candidate = (globalThis as { ai?: unknown }).ai;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  return candidate as BrowserAi;
}

function isProbablyEnglish(text: string): boolean {
  // Quick fallback heuristic used only when no detector is available.
  if (/[^\x00-\x7F]/.test(text)) {
    return false;
  }

  const lowered = text.toLowerCase();
  const englishMarkers = [
    " the ",
    " and ",
    " with ",
    " create ",
    " make ",
    " music ",
    " loop",
    " intro",
  ];

  const padded = ` ${lowered} `;
  return englishMarkers.some((marker) => padded.includes(marker));
}

async function detectLanguage(input: string): Promise<string | null> {
  const ai = getBrowserAi();
  const createDetector = ai?.languageDetector?.create;

  if (!createDetector) {
    return null;
  }

  try {
    const detector = await createDetector();
    const detection = await detector.detect(input);
    detector.destroy?.();

    const first = Array.isArray(detection) ? detection[0] : detection;
    const detected = first?.detectedLanguage ?? first?.language;

    if (typeof detected === "string" && detected.length > 0) {
      return detected.toLowerCase();
    }
  } catch {
    return null;
  }

  return null;
}

async function buildTranslator(
  sourceLanguage: string,
): Promise<AiTranslator | null> {
  const ai = getBrowserAi();
  const translatorApi = ai?.translator;

  if (!translatorApi?.create) {
    return null;
  }

  try {
    if (translatorApi.canTranslate) {
      const availability = await translatorApi.canTranslate({
        sourceLanguage,
        targetLanguage: "en",
      });

      if (availability === false || availability === "no") {
        return null;
      }
    }

    return await translatorApi.create({
      sourceLanguage,
      targetLanguage: "en",
    });
  } catch {
    return null;
  }
}

export async function translateToEnglishIfNeeded(
  input: string,
): Promise<string> {
  const text = input.trim();
  if (!text) {
    return input;
  }

  const detectedLanguage = await detectLanguage(text);

  if (detectedLanguage === "en" || detectedLanguage?.startsWith("en-")) {
    return input;
  }

  if (!detectedLanguage && isProbablyEnglish(text)) {
    return input;
  }

  const translator = await buildTranslator(detectedLanguage ?? "auto");
  if (!translator) {
    return input;
  }

  try {
    const translated = await Promise.resolve(translator.translate(text));
    translator.destroy?.();

    if (typeof translated === "string" && translated.trim().length > 0) {
      return translated;
    }
  } catch {
    return input;
  }

  return input;
}
