import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { buildChatPromptRequest, buildLiveJamRequest } from "./lib/adapters";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled, setFeatureFlag } from "./lib/featureFlags";
import { GenerationOrchestrator } from "./lib/orchestrator";
import type { GenerationResult, GenerationStatus } from "./lib/types";
import type { MusicGenQualityPreset } from "./lib/types";
import {
  preloadMusicGenModel,
  setMusicGenProgressReporter,
} from "./lib/localInference";

type ModelLoadStatus = "loading" | "ready" | "failed";
type ThemeMode = "light" | "dark";
type UiLanguage = "pl" | "en";

const MUSICGEN_QUALITY_STORAGE_KEY = "iki-music/musicgen-quality-preset";
const THEME_STORAGE_KEY = "iki-music/theme";
const LANGUAGE_STORAGE_KEY = "iki-music/language";
const CHAT_DURATION_OVERRIDE_STORAGE_KEY = "iki-music/chat-duration-override";
const HARD_MAX_CHAT_DURATION_SECONDS = 120;

interface UiText {
  appTitle: string;
  localPlayground: string;
  appSubtitle: string;
  installApp: string;
  installUnavailable: string;
  switchToLight: string;
  switchToDark: string;
  lightMode: string;
  darkMode: string;
  languageButton: string;
  downloadingTokenizer: string;
  downloadingModel: string;
  modelReady: string;
  modelLoadFailed: string;
  fallbackActive: string;
  reEnableAiModes: string;
  generationMode: string;
  liveJam: string;
  chatGenerate: string;
  speedQualityPreset: string;
  presetSelectedInfo: (
    label: string,
    tokens: number,
    guidance: number,
  ) => string;
  liveAccompaniment: string;
  notesProgression: string;
  previewDuration: (seconds: number) => string;
  previewDurationAria: string;
  simulateProviderFailure: string;
  enable: string;
  mute: string;
  unmute: string;
  chatPromptGeneration: string;
  prompt: string;
  generatedClipDuration: (seconds: number) => string;
  chatDurationAria: string;
  chatDurationHint: string;
  chatSmartCapInfo: (cap: number) => string;
  unlockExtendedDuration: string;
  restoreSmartCap: string;
  targetBpm: string;
  chatOptions: string;
  instrumentalOnly: string;
  includeDrums: string;
  generateFromChat: string;
  generatingResponse: string;
  chatProgressAria: string;
  generationStatus: string;
  status: string;
  error: string;
  generatedTimeline: string;
  generatedResults: string;
  noGenerationsYet: string;
  browserNoAudio: string;
  pausePreview: string;
  playPreview: string;
  invalidPrompt: string;
  emptyPrompt: string;
  providerTemporaryFailure: string;
}

const UI_TEXT: Record<UiLanguage, UiText> = {
  en: {
    appTitle: "AI Music Studio",
    localPlayground: "Local AI Music Playground",
    appSubtitle: "Create music in live jam mode or from chat prompts.",
    installApp: "Install app",
    installUnavailable:
      "Automatic install is not available yet. Use the browser menu to install this app.",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    languageButton: "PL / EN",
    downloadingTokenizer: "Downloading tokenizer",
    downloadingModel: "Downloading MusicGen model",
    modelReady: "MusicGen ready",
    modelLoadFailed: "Failed to load MusicGen model.",
    fallbackActive:
      "AI generation modes are currently disabled. Fallback mode is active.",
    reEnableAiModes: "Re-enable AI modes",
    generationMode: "Generation mode",
    liveJam: "Live Jam",
    chatGenerate: "Chat Generate",
    speedQualityPreset: "Speed / quality preset",
    presetSelectedInfo: (label, tokens, guidance) =>
      `${label} is selected. Estimated cost for a 6s clip: ~${tokens} tokens at guidance ${guidance}.`,
    liveAccompaniment: "Live Accompaniment",
    notesProgression: "Notes / progression",
    previewDuration: (seconds) => `Preview duration: ${seconds}s`,
    previewDurationAria: "Preview duration (seconds)",
    simulateProviderFailure: "Simulate provider failure",
    enable: "Enable",
    mute: "Mute",
    unmute: "Unmute",
    chatPromptGeneration: "Chat Prompt Generation",
    prompt: "Prompt",
    generatedClipDuration: (seconds) => `Generated clip duration: ${seconds}s`,
    chatDurationAria: "Chat generated duration (seconds)",
    chatDurationHint:
      "Long clips may take several minutes and can fail on weaker devices.",
    chatSmartCapInfo: (cap) =>
      `Smart cap detected for this device: ${cap}s. You can still unlock 120s manually.`,
    unlockExtendedDuration: "Unlock 120s",
    restoreSmartCap: "Use smart cap",
    targetBpm: "Target BPM (optional, 60-200)",
    chatOptions: "Chat generation options",
    instrumentalOnly: "Instrumental only",
    includeDrums: "Include drums groove",
    generateFromChat: "Generate from chat",
    generatingResponse: "Generating response...",
    chatProgressAria: "Chat generation progress",
    generationStatus: "Generation status",
    status: "Status",
    error: "Error",
    generatedTimeline: "Generated timeline",
    generatedResults: "Generated Results",
    noGenerationsYet: "No generations yet.",
    browserNoAudio: "Your browser does not support audio playback.",
    pausePreview: "Pause preview",
    playPreview: "Play preview",
    invalidPrompt: "Invalid prompt",
    emptyPrompt: "Prompt cannot be empty.",
    providerTemporaryFailure: "Provider temporary failure",
  },
  pl: {
    appTitle: "Studio Muzyki AI",
    localPlayground: "Lokalne Studio Muzyczne AI",
    appSubtitle: "Tworz muzyke w trybie live jam albo z promptow czatu.",
    installApp: "Zainstaluj aplikacje",
    installUnavailable:
      "Automatyczna instalacja nie jest jeszcze dostepna. Uzyj menu przegladarki, aby zainstalowac te aplikacje.",
    switchToLight: "Przelacz na jasny motyw",
    switchToDark: "Przelacz na ciemny motyw",
    lightMode: "Jasny motyw",
    darkMode: "Ciemny motyw",
    languageButton: "EN / PL",
    downloadingTokenizer: "Pobieranie tokenizera",
    downloadingModel: "Pobieranie modelu MusicGen",
    modelReady: "MusicGen gotowy",
    modelLoadFailed: "Nie udalo sie zaladowac modelu MusicGen.",
    fallbackActive:
      "Tryby generowania AI sa obecnie wylaczone. Aktywny jest tryb awaryjny.",
    reEnableAiModes: "Wlacz ponownie tryby AI",
    generationMode: "Tryb generowania",
    liveJam: "Live Jam",
    chatGenerate: "Generowanie z czatu",
    speedQualityPreset: "Preset szybkosci / jakosci",
    presetSelectedInfo: (label, tokens, guidance) =>
      `Wybrano ${label}. Szacowany koszt dla klipu 6s: ~${tokens} tokenow przy guidance ${guidance}.`,
    liveAccompaniment: "Akompaniament na zywo",
    notesProgression: "Nuty / progresja",
    previewDuration: (seconds) => `Dlugosc podgladu: ${seconds}s`,
    previewDurationAria: "Dlugosc podgladu (sekundy)",
    simulateProviderFailure: "Symuluj blad providera",
    enable: "Wlacz",
    mute: "Wycisz",
    unmute: "Odlacz wyciszenie",
    chatPromptGeneration: "Generowanie z promptu czatu",
    prompt: "Prompt",
    generatedClipDuration: (seconds) =>
      `Dlugosc generowanego klipu: ${seconds}s`,
    chatDurationAria: "Dlugosc utworu z czatu (sekundy)",
    chatDurationHint:
      "Dluzsze klipy moga generowac sie kilka minut i moga nie dzialac stabilnie na slabszych urzadzeniach.",
    chatSmartCapInfo: (cap) =>
      `Wykryto smart cap dla tego urzadzenia: ${cap}s. Nadal mozesz recznie odblokowac 120s.`,
    unlockExtendedDuration: "Odblokuj 120s",
    restoreSmartCap: "Uzyj smart cap",
    targetBpm: "Docelowe BPM (opcjonalnie, 60-200)",
    chatOptions: "Opcje generowania czatu",
    instrumentalOnly: "Tylko instrumental",
    includeDrums: "Dodaj groove perkusyjny",
    generateFromChat: "Generuj z czatu",
    generatingResponse: "Generowanie odpowiedzi...",
    chatProgressAria: "Postep generowania z czatu",
    generationStatus: "Status generowania",
    status: "Status",
    error: "Blad",
    generatedTimeline: "Osi czasu generacji",
    generatedResults: "Wygenerowane wyniki",
    noGenerationsYet: "Brak wygenerowanych wynikow.",
    browserNoAudio: "Twoja przegladarka nie obsluguje odtwarzania audio.",
    pausePreview: "Wstrzymaj podglad",
    playPreview: "Odtworz podglad",
    invalidPrompt: "Nieprawidlowy prompt",
    emptyPrompt: "Prompt nie moze byc pusty.",
    providerTemporaryFailure: "Tymczasowa awaria providera",
  },
};

const MUSICGEN_QUALITY_PRESET_INFO: Record<
  UiLanguage,
  Record<
    MusicGenQualityPreset,
    { label: string; tokensPerSecond: number; guidanceScale: number }
  >
> = {
  en: {
    fast: { label: "Fast draft", tokensPerSecond: 4, guidanceScale: 2.5 },
    balanced: { label: "Balanced", tokensPerSecond: 6, guidanceScale: 3 },
    quality: { label: "Better quality", tokensPerSecond: 8, guidanceScale: 4 },
  },
  pl: {
    fast: { label: "Szybki szkic", tokensPerSecond: 4, guidanceScale: 2.5 },
    balanced: { label: "Balans", tokensPerSecond: 6, guidanceScale: 3 },
    quality: { label: "Lepsza jakosc", tokensPerSecond: 8, guidanceScale: 4 },
  },
};

function readStoredMusicGenQualityPreset(): MusicGenQualityPreset {
  if (typeof window === "undefined") {
    return "fast";
  }

  const storedPreset = window.localStorage.getItem(
    MUSICGEN_QUALITY_STORAGE_KEY,
  );

  if (
    storedPreset === "fast" ||
    storedPreset === "balanced" ||
    storedPreset === "quality"
  ) {
    return storedPreset;
  }

  return "fast";
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredLanguage(): UiLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage === "pl" || storedLanguage === "en") {
    return storedLanguage;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith("pl") ? "pl" : "en";
}

function readStoredChatDurationOverride(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(CHAT_DURATION_OVERRIDE_STORAGE_KEY) === "1"
  );
}

function detectSmartChatDurationCap(): number {
  if (typeof window === "undefined") {
    return 60;
  }

  const navigatorWithMemory = window.navigator as Navigator & {
    deviceMemory?: number;
  };
  const memory = navigatorWithMemory.deviceMemory ?? 4;
  const cores = window.navigator.hardwareConcurrency ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
    window.navigator.userAgent,
  );

  if (isMobile || memory <= 4 || cores <= 4) {
    return 30;
  }

  if (memory <= 8 || cores <= 8) {
    return 60;
  }

  return HARD_MAX_CHAT_DURATION_SECONDS;
}

function localizeErrorMessage(message: string, language: UiLanguage): string {
  const ui = UI_TEXT[language];

  if (message === "Prompt cannot be empty.") {
    return ui.emptyPrompt;
  }

  if (message === "Provider temporary failure") {
    return ui.providerTemporaryFailure;
  }

  if (message === "Invalid prompt") {
    return ui.invalidPrompt;
  }

  return message;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function App() {
  const orchestrator = useMemo(() => new GenerationOrchestrator(), []);
  const [state, setState] = useState(orchestrator.getState());
  const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus>(
    import.meta.env.MODE === "test" ? "ready" : "loading",
  );
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [modelLoadStage, setModelLoadStage] = useState<
    "tokenizer" | "model" | "ready"
  >("tokenizer");
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live-jam" | "chat-generate">("live-jam");
  const [liveNotes, setLiveNotes] = useState("C G Am F");
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(6);
  const [chatPrompt, setChatPrompt] = useState(
    "Create a mellow lo-fi guitar loop",
  );
  const [chatDurationSeconds, setChatDurationSeconds] = useState(6);
  const [chatDurationOverride, setChatDurationOverride] = useState(() =>
    import.meta.env.MODE === "test" ? false : readStoredChatDurationOverride(),
  );
  const [smartChatDurationCap] = useState(() =>
    import.meta.env.MODE === "test"
      ? HARD_MAX_CHAT_DURATION_SECONDS
      : detectSmartChatDurationCap(),
  );
  const [chatBpm, setChatBpm] = useState("120");
  const [chatInstrumentalOnly, setChatInstrumentalOnly] = useState(true);
  const [chatIncludeDrums, setChatIncludeDrums] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<GenerationResult[]>([]);
  const [muted, setMuted] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [liveFailure, setLiveFailure] = useState(false);
  const [chatFailure, setChatFailure] = useState(false);
  const [musicGenQualityPreset, setMusicGenQualityPreset] =
    useState<MusicGenQualityPreset>(() =>
      import.meta.env.MODE === "test"
        ? "fast"
        : readStoredMusicGenQualityPreset(),
    );
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installHint, setInstallHint] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    import.meta.env.MODE === "test" ? "light" : readStoredTheme(),
  );
  const [language, setLanguage] = useState<UiLanguage>(() =>
    import.meta.env.MODE === "test" ? "en" : readStoredLanguage(),
  );

  const ui = UI_TEXT[language];

  const isLiveEnabled = isFeatureEnabled("ai-jam-accompaniment");
  const isChatEnabled = isFeatureEnabled("chat-prompt-music-generation");

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = orchestrator.subscribe((nextState) => {
      setState(nextState);
      if (nextState.result) {
        setTimeline((previous) => [nextState.result!, ...previous]);
      }
    });

    if (import.meta.env.MODE === "test") {
      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    setMusicGenProgressReporter(({ progress, stage }) => {
      if (cancelled) {
        return;
      }

      const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
      setModelLoadStage(stage);
      setModelLoadProgress(percent);
    });

    void preloadMusicGenModel()
      .then(() => {
        if (!cancelled) {
          setModelLoadProgress(100);
          setModelLoadStage("ready");
          setModelLoadStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setModelLoadStatus("failed");
          setModelLoadError(
            error instanceof Error ? error.message : ui.modelLoadFailed,
          );
        }
      });

    return () => {
      cancelled = true;
      setMusicGenProgressReporter(null);
      unsubscribe();
    };
  }, [orchestrator, ui.modelLoadFailed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        MUSICGEN_QUALITY_STORAGE_KEY,
        musicGenQualityPreset,
      );
    }
  }, [musicGenQualityPreset]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event): void {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) {
      setInstallHint(ui.installUnavailable);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallHint(null);
  }

  function handleToggleTheme() {
    setThemeMode((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  }

  function handleToggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "pl" : "en"));
    setInstallHint(null);
  }

  const effectiveMode =
    !isLiveEnabled && mode === "live-jam" && isChatEnabled
      ? "chat-generate"
      : !isChatEnabled && mode === "chat-generate" && isLiveEnabled
        ? "live-jam"
        : mode;

  const statusLabel = statusToText(state.status, language);
  const selectedPresetInfo =
    MUSICGEN_QUALITY_PRESET_INFO[language][musicGenQualityPreset];
  const defaultClipSeconds = 6;
  const effectiveChatDurationMax = chatDurationOverride
    ? HARD_MAX_CHAT_DURATION_SECONDS
    : smartChatDurationCap;
  const selectedPresetTokens =
    selectedPresetInfo.tokensPerSecond * defaultClipSeconds;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        CHAT_DURATION_OVERRIDE_STORAGE_KEY,
        chatDurationOverride ? "1" : "0",
      );
    }
  }, [chatDurationOverride]);

  useEffect(() => {
    setChatDurationSeconds((currentSeconds) =>
      currentSeconds > effectiveChatDurationMax
        ? effectiveChatDurationMax
        : currentSeconds,
    );
  }, [effectiveChatDurationMax]);

  async function handleLiveEnable() {
    setValidationError(null);
    const request = buildLiveJamRequest({
      sessionId: "session-live",
      notes: liveNotes,
      durationSeconds: liveDurationSeconds,
      musicGenQualityPreset,
      forceFailure: liveFailure,
    });
    await orchestrator.generate(request);
  }

  function handleLiveStop() {
    orchestrator.reset();
    setPlayingId(null);
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    try {
      const request = buildChatPromptRequest({
        sessionId: "session-chat",
        prompt: chatPrompt,
        durationSeconds: chatDurationSeconds,
        bpm: chatBpm.trim().length === 0 ? undefined : Number(chatBpm),
        instrumentalOnly: chatInstrumentalOnly,
        includeDrums: chatIncludeDrums,
        musicGenQualityPreset,
        forceFailure: chatFailure,
      });
      await orchestrator.generate(request);
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? localizeErrorMessage(error.message, language)
          : ui.invalidPrompt,
      );
    }
  }

  if (modelLoadStatus === "loading") {
    const progressLabel =
      modelLoadStage === "tokenizer"
        ? ui.downloadingTokenizer
        : modelLoadStage === "model"
          ? ui.downloadingModel
          : ui.modelReady;

    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-lg backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/85">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {ui.appTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleTheme}
                aria-pressed={themeMode === "dark"}
                aria-label={
                  themeMode === "dark" ? ui.switchToLight : ui.switchToDark
                }
              >
                {themeMode === "dark" ? ui.lightMode : ui.darkMode}
              </Button>
              <Button
                variant="outline"
                onClick={handleInstallApp}
                tabIndex={installPrompt ? 0 : -1}
              >
                {ui.installApp}
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleLanguage}
                aria-label="Switch language"
              >
                {ui.languageButton}
              </Button>
            </div>
          </div>
          {installHint && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              {installHint}
            </p>
          )}
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {progressLabel}... {modelLoadProgress}%
          </p>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            aria-label="MusicGen model loading progress"
            aria-valuenow={modelLoadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-slate-900 transition-[width] dark:bg-slate-100"
              style={{ width: `${modelLoadProgress}%` }}
            />
          </div>
        </div>
      </main>
    );
  }

  if (modelLoadStatus === "failed") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
        <div className="space-y-4 rounded-2xl border border-red-200 bg-white/90 p-5 shadow-lg sm:p-6 dark:border-red-400/70 dark:bg-slate-900/85">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {ui.appTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleTheme}
                aria-pressed={themeMode === "dark"}
                aria-label={
                  themeMode === "dark" ? ui.switchToLight : ui.switchToDark
                }
              >
                {themeMode === "dark" ? ui.lightMode : ui.darkMode}
              </Button>
              <Button
                variant="outline"
                onClick={handleInstallApp}
                tabIndex={installPrompt ? 0 : -1}
              >
                {ui.installApp}
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleLanguage}
                aria-label="Switch language"
              >
                {ui.languageButton}
              </Button>
            </div>
          </div>
          {installHint && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              {installHint}
            </p>
          )}
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {modelLoadError ?? ui.modelLoadFailed}
          </p>
        </div>
      </main>
    );
  }

  if (!isLiveEnabled && !isChatEnabled) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
        <section className="space-y-4 rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-lg sm:p-6 dark:border-amber-400/70 dark:bg-slate-900/85">
          <h1 className="text-3xl font-semibold tracking-tight">
            {ui.appTitle}
          </h1>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {ui.fallbackActive}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFeatureFlag("ai-jam-accompaniment", true);
              setFeatureFlag("chat-prompt-music-generation", true);
              window.location.reload();
            }}
          >
            {ui.reEnableAiModes}
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 text-slate-900 sm:px-6 lg:px-8 dark:text-slate-100">
      <header className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              {ui.localPlayground}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {ui.appTitle}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {ui.appSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleTheme}
              aria-pressed={themeMode === "dark"}
              aria-label={
                themeMode === "dark" ? ui.switchToLight : ui.switchToDark
              }
            >
              {themeMode === "dark" ? ui.lightMode : ui.darkMode}
            </Button>
            <Button
              variant="outline"
              onClick={handleInstallApp}
              tabIndex={installPrompt ? 0 : -1}
            >
              {ui.installApp}
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleLanguage}
              aria-label="Switch language"
            >
              {ui.languageButton}
            </Button>
          </div>
        </div>
        {installHint && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            {installHint}
          </p>
        )}
      </header>

      <section
        className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80"
        aria-label={ui.generationMode}
      >
        {isLiveEnabled && (
          <Button
            variant={effectiveMode === "live-jam" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("live-jam")}
          >
            {ui.liveJam}
          </Button>
        )}
        {isChatEnabled && (
          <Button
            variant={effectiveMode === "chat-generate" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("chat-generate")}
          >
            {ui.chatGenerate}
          </Button>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
        <label htmlFor="musicgen-quality" className="text-sm font-medium">
          {ui.speedQualityPreset}
        </label>
        <select
          id="musicgen-quality"
          value={musicGenQualityPreset}
          onChange={(event) =>
            setMusicGenQualityPreset(
              event.target.value as MusicGenQualityPreset,
            )
          }
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="fast">
            {MUSICGEN_QUALITY_PRESET_INFO[language].fast.label} - ~
            {MUSICGEN_QUALITY_PRESET_INFO[language].fast.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
          <option value="balanced">
            {MUSICGEN_QUALITY_PRESET_INFO[language].balanced.label} - ~
            {MUSICGEN_QUALITY_PRESET_INFO[language].balanced.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
          <option value="quality">
            {MUSICGEN_QUALITY_PRESET_INFO[language].quality.label} - ~
            {MUSICGEN_QUALITY_PRESET_INFO[language].quality.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
        </select>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          {ui.presetSelectedInfo(
            selectedPresetInfo.label,
            selectedPresetTokens,
            selectedPresetInfo.guidanceScale,
          )}
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/85">
        {effectiveMode === "live-jam" && isLiveEnabled && (
          <>
            <h2 className="text-lg font-medium">{ui.liveAccompaniment}</h2>
            <label htmlFor="live-notes" className="text-sm font-medium">
              {ui.notesProgression}
            </label>
            <input
              id="live-notes"
              value={liveNotes}
              onChange={(event) => setLiveNotes(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <label htmlFor="live-duration" className="text-sm font-medium">
              {ui.previewDuration(liveDurationSeconds)}
            </label>
            <input
              id="live-duration"
              type="range"
              min={2}
              max={12}
              step={1}
              value={liveDurationSeconds}
              onChange={(event) =>
                setLiveDurationSeconds(Number(event.target.value))
              }
              aria-label={ui.previewDurationAria}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={liveFailure}
                onChange={(event) => setLiveFailure(event.target.checked)}
              />
              {ui.simulateProviderFailure}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                onClick={handleLiveEnable}
                aria-label="Enable accompaniment"
              >
                {ui.enable}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => setMuted((current) => !current)}
                aria-label="Mute accompaniment"
              >
                {muted ? ui.unmute : ui.mute}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={handleLiveStop}
                aria-label="Stop accompaniment"
              >
                Stop
              </Button>
            </div>
          </>
        )}

        {effectiveMode === "chat-generate" && isChatEnabled && (
          <>
            <h2 className="text-lg font-medium">{ui.chatPromptGeneration}</h2>
            <form onSubmit={handleChatSubmit} className="space-y-3">
              <label htmlFor="chat-prompt" className="text-sm font-medium">
                {ui.prompt}
              </label>
              <textarea
                id="chat-prompt"
                value={chatPrompt}
                onChange={(event) => setChatPrompt(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <label htmlFor="chat-duration" className="text-sm font-medium">
                {ui.generatedClipDuration(chatDurationSeconds)}
              </label>
              <input
                id="chat-duration"
                type="range"
                min={2}
                max={effectiveChatDurationMax}
                step={1}
                value={chatDurationSeconds}
                onChange={(event) =>
                  setChatDurationSeconds(Number(event.target.value))
                }
                aria-label={ui.chatDurationAria}
              />
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {ui.chatDurationHint}
              </p>
              {smartChatDurationCap < HARD_MAX_CHAT_DURATION_SECONDS && (
                <div className="flex flex-col gap-2 rounded-md border border-cyan-200 bg-cyan-50 p-2 text-xs text-cyan-900 dark:border-cyan-700/60 dark:bg-cyan-900/20 dark:text-cyan-100">
                  <p>{ui.chatSmartCapInfo(smartChatDurationCap)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setChatDurationOverride(
                        (currentOverride) => !currentOverride,
                      )
                    }
                  >
                    {chatDurationOverride
                      ? ui.restoreSmartCap
                      : ui.unlockExtendedDuration}
                  </Button>
                </div>
              )}
              <label htmlFor="chat-bpm" className="text-sm font-medium">
                {ui.targetBpm}
              </label>
              <input
                id="chat-bpm"
                type="number"
                min={60}
                max={200}
                step={1}
                inputMode="numeric"
                value={chatBpm}
                onChange={(event) => setChatBpm(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-medium">{ui.chatOptions}</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={chatInstrumentalOnly}
                    onChange={(event) =>
                      setChatInstrumentalOnly(event.target.checked)
                    }
                  />
                  {ui.instrumentalOnly}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={chatIncludeDrums}
                    onChange={(event) =>
                      setChatIncludeDrums(event.target.checked)
                    }
                  />
                  {ui.includeDrums}
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={chatFailure}
                  onChange={(event) => setChatFailure(event.target.checked)}
                />
                {ui.simulateProviderFailure}
              </label>
              <Button type="submit">{ui.generateFromChat}</Button>
            </form>
            {state.status === "processing" && (
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-100">
                  {ui.generatingResponse}
                </p>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                  aria-label={ui.chatProgressAria}
                  aria-valuenow={undefined}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                >
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-slate-900 dark:bg-slate-100" />
                </div>
              </div>
            )}
            {validationError && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                {validationError}
              </p>
            )}
          </>
        )}
      </section>

      <section
        className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/85"
        role="status"
        aria-live="polite"
        aria-label={ui.generationStatus}
      >
        <strong>{ui.status}:</strong> {statusLabel}
      </section>

      {state.error && (
        <section
          className="rounded-2xl border border-red-300 bg-red-50 p-3 text-red-800 shadow-sm"
          role="alert"
        >
          <strong>{ui.error}:</strong>{" "}
          {localizeErrorMessage(state.error.message, language)}
        </section>
      )}

      <section
        className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md dark:border-slate-700/70 dark:bg-slate-900/85"
        aria-label={ui.generatedTimeline}
      >
        <h2 className="text-lg font-medium">{ui.generatedResults}</h2>
        {timeline.length === 0 && <p>{ui.noGenerationsYet}</p>}
        <ul className="mt-2 space-y-2">
          {timeline.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <p className="text-sm">{entry.content}</p>
              {entry.audio ? (
                <audio controls className="mt-2 w-full" src={entry.audio.url}>
                  {ui.browserNoAudio}
                </audio>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setPlayingId((current) =>
                      current === entry.id ? null : entry.id,
                    )
                  }
                >
                  {playingId === entry.id ? ui.pausePreview : ui.playPreview}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function statusToText(status: GenerationStatus, language: UiLanguage): string {
  const statusMap: Record<UiLanguage, Record<GenerationStatus, string>> = {
    en: {
      idle: "Idle",
      processing: "Processing",
      ready: "Ready",
      degraded: "Degraded - high latency",
      failed: "Failed",
    },
    pl: {
      idle: "Bezczynny",
      processing: "Przetwarzanie",
      ready: "Gotowe",
      degraded: "Ograniczony - duza latencja",
      failed: "Niepowodzenie",
    },
  };

  return statusMap[language][status];
}

export default App;
