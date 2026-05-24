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
const MUSICGEN_QUALITY_STORAGE_KEY = "iki-music/musicgen-quality-preset";
const THEME_STORAGE_KEY = "iki-music/theme";

type ThemeMode = "light" | "dark";

const MUSICGEN_QUALITY_PRESET_INFO: Record<
  MusicGenQualityPreset,
  { label: string; tokensPerSecond: number; guidanceScale: number }
> = {
  fast: { label: "Fast draft", tokensPerSecond: 4, guidanceScale: 2.5 },
  balanced: { label: "Balanced", tokensPerSecond: 6, guidanceScale: 3 },
  quality: { label: "Better quality", tokensPerSecond: 8, guidanceScale: 4 },
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
            error instanceof Error
              ? error.message
              : "Failed to load MusicGen model.",
          );
        }
      });

    return () => {
      cancelled = true;
      setMusicGenProgressReporter(null);
      unsubscribe();
    };
  }, [orchestrator]);

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
      setInstallHint(
        "Automatic install is not available yet. Use the browser menu to install this app.",
      );
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

  if (modelLoadStatus === "loading") {
    const progressLabel =
      modelLoadStage === "tokenizer"
        ? "Downloading tokenizer"
        : modelLoadStage === "model"
          ? "Downloading MusicGen model"
          : "MusicGen ready";

    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-lg backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/85">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              AI Music Studio
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleTheme}
                aria-pressed={themeMode === "dark"}
                aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              >
                {themeMode === "dark" ? "Light mode" : "Dark mode"}
              </Button>
              <Button
                variant="outline"
                onClick={handleInstallApp}
                tabIndex={installPrompt ? 0 : -1}
              >
                Install app
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
              AI Music Studio
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToggleTheme}
                aria-pressed={themeMode === "dark"}
                aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              >
                {themeMode === "dark" ? "Light mode" : "Dark mode"}
              </Button>
              <Button
                variant="outline"
                onClick={handleInstallApp}
                tabIndex={installPrompt ? 0 : -1}
              >
                Install app
              </Button>
            </div>
          </div>
          {installHint && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              {installHint}
            </p>
          )}
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {modelLoadError ?? "Failed to load MusicGen model."}
          </p>
        </div>
      </main>
    );
  }

  const effectiveMode =
    !isLiveEnabled && mode === "live-jam" && isChatEnabled
      ? "chat-generate"
      : !isChatEnabled && mode === "chat-generate" && isLiveEnabled
        ? "live-jam"
        : mode;

  const statusLabel = statusToText(state.status);
  const selectedPresetInfo =
    MUSICGEN_QUALITY_PRESET_INFO[musicGenQualityPreset];
  const defaultClipSeconds = 6;
  const selectedPresetTokens =
    selectedPresetInfo.tokensPerSecond * defaultClipSeconds;

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
        error instanceof Error ? error.message : "Invalid prompt",
      );
    }
  }

  if (!isLiveEnabled && !isChatEnabled) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
        <section className="space-y-4 rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-lg sm:p-6 dark:border-amber-400/70 dark:bg-slate-900/85">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Music Studio
          </h1>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            AI generation modes are currently disabled. Fallback mode is active.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFeatureFlag("ai-jam-accompaniment", true);
              setFeatureFlag("chat-prompt-music-generation", true);
              window.location.reload();
            }}
          >
            Re-enable AI modes
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
              Local AI Music Playground
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              AI Music Studio
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Create music in live jam mode or from chat prompts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggleTheme}
              aria-pressed={themeMode === "dark"}
              aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
            >
              {themeMode === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button
              variant="outline"
              onClick={handleInstallApp}
              tabIndex={installPrompt ? 0 : -1}
            >
              Install app
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
        aria-label="Generation mode"
      >
        {isLiveEnabled && (
          <Button
            variant={effectiveMode === "live-jam" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("live-jam")}
          >
            Live Jam
          </Button>
        )}
        {isChatEnabled && (
          <Button
            variant={effectiveMode === "chat-generate" ? "default" : "outline"}
            className="w-full"
            onClick={() => setMode("chat-generate")}
          >
            Chat Generate
          </Button>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
        <label htmlFor="musicgen-quality" className="text-sm font-medium">
          Speed / quality preset
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
            Fast draft - ~
            {MUSICGEN_QUALITY_PRESET_INFO.fast.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
          <option value="balanced">
            Balanced - ~
            {MUSICGEN_QUALITY_PRESET_INFO.balanced.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
          <option value="quality">
            Better quality - ~
            {MUSICGEN_QUALITY_PRESET_INFO.quality.tokensPerSecond *
              defaultClipSeconds}{" "}
            tokens / 6s
          </option>
        </select>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          {selectedPresetInfo.label} is selected. Estimated cost for a 6s clip:
          ~{selectedPresetTokens} tokens at guidance{" "}
          {selectedPresetInfo.guidanceScale}.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/85">
        {effectiveMode === "live-jam" && isLiveEnabled && (
          <>
            <h2 className="text-lg font-medium">Live Accompaniment</h2>
            <label htmlFor="live-notes" className="text-sm font-medium">
              Notes / progression
            </label>
            <input
              id="live-notes"
              value={liveNotes}
              onChange={(event) => setLiveNotes(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <label htmlFor="live-duration" className="text-sm font-medium">
              Preview duration: {liveDurationSeconds}s
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
              aria-label="Preview duration (seconds)"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={liveFailure}
                onChange={(event) => setLiveFailure(event.target.checked)}
              />
              Simulate provider failure
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                onClick={handleLiveEnable}
                aria-label="Enable accompaniment"
              >
                Enable
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => setMuted((current) => !current)}
                aria-label="Mute accompaniment"
              >
                {muted ? "Unmute" : "Mute"}
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
            <h2 className="text-lg font-medium">Chat Prompt Generation</h2>
            <form onSubmit={handleChatSubmit} className="space-y-3">
              <label htmlFor="chat-prompt" className="text-sm font-medium">
                Prompt
              </label>
              <textarea
                id="chat-prompt"
                value={chatPrompt}
                onChange={(event) => setChatPrompt(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <label htmlFor="chat-duration" className="text-sm font-medium">
                Generated clip duration: {chatDurationSeconds}s
              </label>
              <input
                id="chat-duration"
                type="range"
                min={2}
                max={12}
                step={1}
                value={chatDurationSeconds}
                onChange={(event) =>
                  setChatDurationSeconds(Number(event.target.value))
                }
                aria-label="Chat generated duration (seconds)"
              />
              <label htmlFor="chat-bpm" className="text-sm font-medium">
                Target BPM (optional, 60-200)
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
                <p className="text-sm font-medium">Chat generation options</p>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={chatInstrumentalOnly}
                    onChange={(event) =>
                      setChatInstrumentalOnly(event.target.checked)
                    }
                  />
                  Instrumental only
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={chatIncludeDrums}
                    onChange={(event) =>
                      setChatIncludeDrums(event.target.checked)
                    }
                  />
                  Include drums groove
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={chatFailure}
                  onChange={(event) => setChatFailure(event.target.checked)}
                />
                Simulate provider failure
              </label>
              <Button type="submit">Generate from chat</Button>
            </form>
            {state.status === "processing" && (
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-100">
                  Generating response...
                </p>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                  aria-label="Chat generation progress"
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
        aria-label="Generation status"
      >
        <strong>Status:</strong> {statusLabel}
      </section>

      {state.error && (
        <section
          className="rounded-2xl border border-red-300 bg-red-50 p-3 text-red-800 shadow-sm"
          role="alert"
        >
          <strong>Error:</strong> {state.error.message}
        </section>
      )}

      <section
        className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md dark:border-slate-700/70 dark:bg-slate-900/85"
        aria-label="Generated timeline"
      >
        <h2 className="text-lg font-medium">Generated Results</h2>
        {timeline.length === 0 && <p>No generations yet.</p>}
        <ul className="mt-2 space-y-2">
          {timeline.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <p className="text-sm">{entry.content}</p>
              {entry.audio ? (
                <audio controls className="mt-2 w-full" src={entry.audio.url}>
                  Your browser does not support audio playback.
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
                  {playingId === entry.id ? "Pause preview" : "Play preview"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function statusToText(status: GenerationStatus): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "degraded":
      return "Degraded - high latency";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

export default App;
