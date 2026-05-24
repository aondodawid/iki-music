import { getAiEnvConfig } from "./env";
import type { MusicGenQualityPreset } from "./types";

type TransformersModule = typeof import("@huggingface/transformers");
type AutoTokenizerType = TransformersModule["AutoTokenizer"];
type MusicgenModelType = TransformersModule["MusicgenForConditionalGeneration"];
type PipelineFactoryType = TransformersModule["pipeline"];
type TextToAudioPipelineType = Awaited<ReturnType<PipelineFactoryType>>;

export interface SupportedLocalModel {
  id: string;
  label: string;
  runtime: "musicgen" | "text-to-audio";
  maxDurationSeconds: number;
}

export const SUPPORTED_LOCAL_MODELS: readonly SupportedLocalModel[] = [
  {
    id: "Xenova/musicgen-small",
    label: "Xenova MusicGen Small",
    runtime: "musicgen",
    maxDurationSeconds: 30,
  },
  {
    id: "harisnaeem/musicgen-small-ONNX",
    label: "HarisNaeem MusicGen Small ONNX",
    runtime: "musicgen",
    maxDurationSeconds: 30,
  },
  {
    id: "lsb/stable-audio-3-small-music-onnx",
    label: "LSB Stable Audio 3 Small ONNX",
    runtime: "text-to-audio",
    maxDurationSeconds: 12,
  },
] as const;

export interface LocalInferenceInput {
  prompt: string;
  durationSeconds?: number;
  qualityPreset?: MusicGenQualityPreset;
}

export interface LocalInferenceOutput {
  text: string;
  audioUrl?: string;
  audioMimeType?: string;
  audioSampleRate?: number;
}

interface CachedMusicGen {
  tokenizer: Awaited<ReturnType<AutoTokenizerType["from_pretrained"]>>;
  model: Awaited<ReturnType<MusicgenModelType["from_pretrained"]>>;
}

export interface MusicGenLoadProgress {
  progress: number;
  loaded: number;
  total: number;
  stage: "tokenizer" | "model";
}

type MusicGenProgressCallback = (progress: MusicGenLoadProgress) => void;
const ESTIMATED_MUSICGEN_MODEL_BYTES = 110443015 + 428422300 + 118056304;
const ESTIMATED_MUSICGEN_MODEL_MIB = (
  ESTIMATED_MUSICGEN_MODEL_BYTES /
  (1024 * 1024)
).toFixed(1);

const WAV_MIME_TYPE = "audio/wav";
const MIN_DURATION_SECONDS = 2;
const MAX_DURATION_SECONDS = 30;
const DEFAULT_DURATION_SECONDS = 6;
const MUSICGEN_MODEL_FALLBACKS: Record<string, string[]> = {
  "facebook/musicgen-small": ["Xenova/musicgen-small"],
  "Xenova/musicgen-small": ["facebook/musicgen-small"],
};
const REMOTE_MODEL_LOAD_RETRY_ATTEMPTS = 3;
const REMOTE_MODEL_LOAD_RETRY_DELAY_MS = 800;
const MUSICGEN_PRELOAD_TIMEOUT_MS = 9000;
const MUSICGEN_MAX_NEW_TOKENS = 1503;
const MUSICGEN_TOKENS_PER_SECOND =
  MUSICGEN_MAX_NEW_TOKENS / MAX_DURATION_SECONDS;
const MODEL_CACHE_PREFIXES = ["/hf-v2/", "/hf/"];
const MUSICGEN_QUALITY_TOKEN_MULTIPLIER: Record<MusicGenQualityPreset, number> =
  {
    fast: 1,
    balanced: 1,
    quality: 1,
  };
const MUSICGEN_GUIDANCE_SCALE: Record<MusicGenQualityPreset, number> = {
  fast: 2.5,
  balanced: 3,
  quality: 4,
};
let cachedMusicGen: CachedMusicGen | null = null;
let cachedModelName: string | null = null;
let cachedTextToAudioPipeline: TextToAudioPipelineType | null = null;
let cachedTextToAudioModelName: string | null = null;
let cachedTransformersModulePromise: Promise<TransformersModule> | null = null;
let transformersFetchPatched = false;
let forceSimulationMode = false;
let activeLocalModelId: string | null = null;

async function getTransformersModule(): Promise<TransformersModule> {
  if (!cachedTransformersModulePromise) {
    cachedTransformersModulePromise = import("@huggingface/transformers");
  }

  return cachedTransformersModulePromise;
}

function getSupportedModelById(modelId: string): SupportedLocalModel {
  return (
    SUPPORTED_LOCAL_MODELS.find((model) => model.id === modelId) ??
    SUPPORTED_LOCAL_MODELS[0]
  );
}

function getConfiguredModelId(): string {
  const configuredModel = getAiEnvConfig().transformersModel;
  return getSupportedModelById(configuredModel).id;
}

function getActiveModelId(): string {
  return getSupportedModelById(activeLocalModelId ?? getConfiguredModelId()).id;
}

function resetRuntimeModelCaches(): void {
  cachedMusicGen = null;
  cachedModelName = null;
  cachedTextToAudioPipeline = null;
  cachedTextToAudioModelName = null;
}

export function getSelectedLocalModel(): string {
  return getActiveModelId();
}

export function setSelectedLocalModel(modelId: string): void {
  const normalizedModelId = getSupportedModelById(modelId).id;
  const previousModelId = getActiveModelId();
  activeLocalModelId = normalizedModelId;

  if (normalizedModelId !== previousModelId) {
    forceSimulationMode = false;
    resetRuntimeModelCaches();
  }
}

export function getModelDurationLimit(modelId: string): number {
  return getSupportedModelById(modelId).maxDurationSeconds;
}

function extractModelIdFromProxyPath(pathname: string): string | null {
  for (const prefix of MODEL_CACHE_PREFIXES) {
    const start = pathname.indexOf(prefix);
    if (start < 0) {
      continue;
    }

    const suffix = pathname.slice(start + prefix.length);
    const segments = suffix.split("/").filter(Boolean);
    if (segments.length < 2) {
      continue;
    }

    return `${segments[0]}/${segments[1]}`;
  }

  return null;
}

export async function clearInactiveModelCache(
  activeModelId: string,
): Promise<void> {
  if (typeof caches === "undefined") {
    return;
  }

  const normalizedActiveModel = getSupportedModelById(activeModelId).id;
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map(async (cacheName) => {
      const cacheStore = await caches.open(cacheName);
      const requests = await cacheStore.keys();

      await Promise.all(
        requests.map(async (request) => {
          const requestUrl = new URL(request.url);
          const modelId = extractModelIdFromProxyPath(requestUrl.pathname);

          if (modelId && modelId !== normalizedActiveModel) {
            await cacheStore.delete(request);
          }
        }),
      );
    }),
  );
}

function clampDurationSeconds(
  value: number | undefined,
  maxDurationSeconds: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_DURATION_SECONDS;
  }

  const rounded = Math.round(value);
  return Math.max(MIN_DURATION_SECONDS, Math.min(maxDurationSeconds, rounded));
}

function estimateMusicGenTokensForPreset(
  durationSeconds: number,
  qualityPreset: MusicGenQualityPreset,
): number {
  const estimatedTokens = Math.ceil(
    durationSeconds *
      MUSICGEN_TOKENS_PER_SECOND *
      MUSICGEN_QUALITY_TOKEN_MULTIPLIER[qualityPreset],
  );

  return Math.max(1, Math.min(MUSICGEN_MAX_NEW_TOKENS, estimatedTokens));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetriableModelLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("could not locate file") ||
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("tokenizer_class") ||
    message.includes("cannot read properties of undefined") ||
    message.includes("unsupported model type") ||
    message.includes("none of the candidate model classes") ||
    message.includes("timed out")
  );
}

async function withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`MusicGen preload timed out after ${ms}ms.`));
    }, ms);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

async function getMusicGen(modelName: string): Promise<CachedMusicGen> {
  let progressReporter: MusicGenProgressCallback | null = null;

  if (typeof globalThis !== "undefined") {
    const maybeReporter = (
      globalThis as { __musicGenProgressReporter?: unknown }
    ).__musicGenProgressReporter;
    if (typeof maybeReporter === "function") {
      progressReporter = maybeReporter as (
        progress: MusicGenLoadProgress,
      ) => void;
    }
  }

  if (cachedMusicGen && cachedModelName === modelName) {
    return cachedMusicGen;
  }

  const { AutoTokenizer, MusicgenForConditionalGeneration, env } =
    await getTransformersModule();

  const envWithRemoteFlag = env as unknown as { allowRemoteModels?: boolean };
  const envWithRemoteHost = env as unknown as {
    remoteHost?: string;
    remotePathTemplate?: string;
  };
  const envWithFetch = env as unknown as {
    fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  };

  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const location = (globalThis as { location?: Location }).location;
    if (location?.origin) {
      envWithRemoteHost.remoteHost = `${location.origin}/hf-v2/`;
      envWithRemoteHost.remotePathTemplate = "{model}/resolve/{revision}/";

      if (!transformersFetchPatched && typeof fetch === "function") {
        const baseFetch =
          typeof envWithFetch.fetch === "function"
            ? envWithFetch.fetch
            : fetch.bind(globalThis);
        const localOrigin = location.origin;

        envWithFetch.fetch = (input, init) => {
          const requestUrl =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;
          const isProxyModelRequest =
            requestUrl.startsWith("/hf-v2/") ||
            requestUrl.startsWith(`${localOrigin}/hf-v2/`);

          if (isProxyModelRequest && init?.cache === "no-store") {
            const nextInit = { ...init };
            delete nextInit.cache;
            return baseFetch(input, nextInit);
          }

          return baseFetch(input, init);
        };

        transformersFetchPatched = true;
      }
    }
  }

  const loadFromPretrained = async (
    localFilesOnly: boolean,
  ): Promise<CachedMusicGen> => {
    const tokenizerOptions = {
      local_files_only: localFilesOnly,
      progress_callback: (progress: unknown) =>
        emitProgress("tokenizer", progress),
    } as Record<string, unknown>;

    const modelOptions = {
      local_files_only: localFilesOnly,
      progress_callback: (progress: unknown) => emitProgress("model", progress),
      dtype: {
        text_encoder: "q8",
        decoder_model_merged: "q8",
        encodec_decode: "fp32",
      },
    } as Record<string, unknown>;

    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(
        modelName,
        tokenizerOptions as Parameters<AutoTokenizerType["from_pretrained"]>[1],
      ),
      MusicgenForConditionalGeneration.from_pretrained(
        modelName,
        modelOptions as Parameters<MusicgenModelType["from_pretrained"]>[1],
      ),
    ]);

    return { tokenizer, model };
  };

  const emitProgress = (
    stage: MusicGenLoadProgress["stage"],
    progressInfo: unknown,
  ): void => {
    if (!progressReporter) {
      return;
    }

    const payload = progressInfo as Record<string, unknown>;
    const loaded = typeof payload.loaded === "number" ? payload.loaded : 0;
    const total = typeof payload.total === "number" ? payload.total : 0;
    const progressValue =
      typeof payload.progress === "number" ? payload.progress : undefined;

    const percent =
      typeof progressValue === "number"
        ? progressValue
        : total > 0
          ? loaded / total
          : 0;

    progressReporter({
      progress: percent,
      loaded,
      total,
      stage,
    });
  };

  // Prefer cached artifacts first; download only when cache is not available yet.
  let loaded: CachedMusicGen | null = null;
  const previousAllowRemoteModels = envWithRemoteFlag.allowRemoteModels;

  try {
    envWithRemoteFlag.allowRemoteModels = false;
    loaded = await loadFromPretrained(true);
  } catch {
    envWithRemoteFlag.allowRemoteModels = true;
    let lastRemoteError: unknown = null;

    for (
      let attempt = 1;
      attempt <= REMOTE_MODEL_LOAD_RETRY_ATTEMPTS;
      attempt += 1
    ) {
      try {
        loaded = await loadFromPretrained(false);
        break;
      } catch (remoteError) {
        lastRemoteError = remoteError;
        const shouldRetry =
          attempt < REMOTE_MODEL_LOAD_RETRY_ATTEMPTS &&
          isRetriableModelLoadError(remoteError);

        if (!shouldRetry) {
          throw remoteError;
        }

        await delay(REMOTE_MODEL_LOAD_RETRY_DELAY_MS * attempt);
      }
    }

    if (!loaded && lastRemoteError) {
      throw lastRemoteError;
    }
  } finally {
    envWithRemoteFlag.allowRemoteModels = previousAllowRemoteModels;
  }

  cachedMusicGen = loaded;
  cachedModelName = modelName;

  if (!cachedMusicGen) {
    throw new Error(
      `Failed to initialize MusicGen model artifacts for ${modelName}.`,
    );
  }

  return cachedMusicGen;
}

function shouldTryModelFallback(error: unknown): boolean {
  return isRetriableModelLoadError(error);
}

async function getMusicGenWithFallback(
  modelName: string,
): Promise<CachedMusicGen> {
  try {
    return await getMusicGen(modelName);
  } catch (primaryError) {
    const fallbacks = MUSICGEN_MODEL_FALLBACKS[modelName] ?? [];

    if (!shouldTryModelFallback(primaryError) || fallbacks.length === 0) {
      throw primaryError;
    }

    for (const fallbackModel of fallbacks) {
      try {
        return await getMusicGen(fallbackModel);
      } catch {
        // Continue trying other fallbacks, if any.
      }
    }

    throw primaryError;
  }
}

async function getTextToAudioPipeline(
  modelName: string,
): Promise<TextToAudioPipelineType> {
  if (cachedTextToAudioPipeline && cachedTextToAudioModelName === modelName) {
    return cachedTextToAudioPipeline;
  }

  const { pipeline } = await getTransformersModule();

  const loadPipeline = async (
    localFilesOnly: boolean,
  ): Promise<TextToAudioPipelineType> =>
    pipeline("text-to-audio", modelName, {
      local_files_only: localFilesOnly,
      progress_callback: (progress: unknown) => {
        const reporter = (
          globalThis as { __musicGenProgressReporter?: unknown }
        ).__musicGenProgressReporter;

        if (typeof reporter !== "function") {
          return;
        }

        const payload = progress as Record<string, unknown>;
        const loaded = typeof payload.loaded === "number" ? payload.loaded : 0;
        const total = typeof payload.total === "number" ? payload.total : 0;
        const progressValue =
          typeof payload.progress === "number"
            ? payload.progress
            : total > 0
              ? loaded / total
              : 0;

        (reporter as MusicGenProgressCallback)({
          progress: progressValue,
          loaded,
          total,
          stage: "model",
        });
      },
    });

  let loadedPipeline: TextToAudioPipelineType | null = null;
  let lastRemoteError: unknown = null;

  try {
    loadedPipeline = await loadPipeline(true);
  } catch {
    for (
      let attempt = 1;
      attempt <= REMOTE_MODEL_LOAD_RETRY_ATTEMPTS;
      attempt += 1
    ) {
      try {
        loadedPipeline = await loadPipeline(false);
        break;
      } catch (remoteError) {
        lastRemoteError = remoteError;
        const shouldRetry =
          attempt < REMOTE_MODEL_LOAD_RETRY_ATTEMPTS &&
          isRetriableModelLoadError(remoteError);

        if (!shouldRetry) {
          throw remoteError;
        }

        await delay(REMOTE_MODEL_LOAD_RETRY_DELAY_MS * attempt);
      }
    }
  }

  if (!loadedPipeline && lastRemoteError) {
    throw lastRemoteError;
  }

  if (!loadedPipeline) {
    throw new Error(
      `Failed to initialize text-to-audio model artifacts for ${modelName}.`,
    );
  }

  cachedTextToAudioPipeline = loadedPipeline;
  cachedTextToAudioModelName = modelName;

  return loadedPipeline;
}

export async function preloadMusicGenModel(modelId?: string): Promise<void> {
  const config = getAiEnvConfig();
  const activeModel = getSupportedModelById(modelId ?? getActiveModelId());

  if (config.useSimulation) {
    return;
  }

  console.log(
    `Model preload estimate: ~${ESTIMATED_MUSICGEN_MODEL_MIB} MiB for ${activeModel.id}.`,
  );

  try {
    if (activeModel.runtime === "musicgen") {
      await withTimeout(
        getMusicGenWithFallback(activeModel.id),
        MUSICGEN_PRELOAD_TIMEOUT_MS,
      );
    } else {
      await withTimeout(
        getTextToAudioPipeline(activeModel.id),
        MUSICGEN_PRELOAD_TIMEOUT_MS,
      );
    }

    forceSimulationMode = false;
  } catch (error) {
    if (!isRetriableModelLoadError(error)) {
      throw error;
    }

    forceSimulationMode = true;
    console.warn(
      "MusicGen model artifacts are unavailable through the current proxy. Falling back to simulation mode.",
      error,
    );
  }
}

export function setMusicGenProgressReporter(
  reporter: ((progress: MusicGenLoadProgress) => void) | null,
): void {
  (
    globalThis as { __musicGenProgressReporter?: unknown }
  ).__musicGenProgressReporter = reporter ?? undefined;
}

export async function generateWithTransformers(
  input: LocalInferenceInput,
): Promise<LocalInferenceOutput> {
  const config = getAiEnvConfig();
  const activeModel = getSupportedModelById(getActiveModelId());
  const durationSeconds = clampDurationSeconds(
    input.durationSeconds,
    activeModel.maxDurationSeconds,
  );
  const qualityPreset = input.qualityPreset ?? "fast";
  const maxNewTokens = estimateMusicGenTokensForPreset(
    durationSeconds,
    qualityPreset,
  );

  if (config.useSimulation || forceSimulationMode) {
    return {
      text: `Local simulated MusicGen output for: ${input.prompt} (${durationSeconds}s)`,
    };
  }

  const { RawAudio } = await getTransformersModule();

  let audioUrl: string;
  let samplingRate = 32000;

  if (activeModel.runtime === "musicgen") {
    const { tokenizer, model } = await getMusicGenWithFallback(activeModel.id);
    const inputs = tokenizer(input.prompt);
    const audioValues = await model.generate({
      ...inputs,
      max_new_tokens: maxNewTokens,
      do_sample: true,
      guidance_scale: MUSICGEN_GUIDANCE_SCALE[qualityPreset],
    });

    const configWithRate = model.config as {
      audio_encoder?: {
        sampling_rate?: number;
      };
    };

    samplingRate = configWithRate.audio_encoder?.sampling_rate ?? 32000;
    const allSamples =
      typeof audioValues === "object" &&
      audioValues !== null &&
      "data" in audioValues &&
      audioValues.data instanceof Float32Array
        ? audioValues.data
        : (() => {
            throw new Error("MusicGen did not return audio waveform data.");
          })();
    const sampleLimit = Math.max(1, Math.floor(samplingRate * durationSeconds));
    const samples =
      allSamples.length > sampleLimit
        ? allSamples.slice(0, sampleLimit)
        : allSamples;

    const audio = new RawAudio(samples, samplingRate);
    audioUrl = URL.createObjectURL(audio.toBlob());
  } else {
    const textToAudio = (await getTextToAudioPipeline(activeModel.id)) as (
      text: string,
      options?: Record<string, unknown>,
    ) => Promise<unknown>;
    const inferenceSteps =
      qualityPreset === "quality" ? 28 : qualityPreset === "balanced" ? 20 : 14;
    const rawResult = await textToAudio(input.prompt, {
      num_inference_steps: inferenceSteps,
    });

    const firstAudio = Array.isArray(rawResult) ? rawResult[0] : rawResult;
    const maybeAudio = firstAudio as {
      audio?: Float32Array;
      sampling_rate?: number;
      toBlob?: () => Blob;
    };

    if (!(maybeAudio.audio instanceof Float32Array) || !maybeAudio.toBlob) {
      throw new Error("Text-to-audio pipeline did not return waveform data.");
    }

    samplingRate =
      typeof maybeAudio.sampling_rate === "number"
        ? maybeAudio.sampling_rate
        : 32000;
    const sampleLimit = Math.max(1, Math.floor(samplingRate * durationSeconds));
    const samples =
      maybeAudio.audio.length > sampleLimit
        ? maybeAudio.audio.slice(0, sampleLimit)
        : maybeAudio.audio;
    const audio = new RawAudio(samples, samplingRate);
    audioUrl = URL.createObjectURL(audio.toBlob());
  }

  const generatedText = `Generated local accompaniment with ${activeModel.label} for: ${input.prompt} (${durationSeconds}s)`;

  return {
    text: generatedText,
    audioUrl,
    audioMimeType: WAV_MIME_TYPE,
    audioSampleRate: samplingRate,
  };
}
