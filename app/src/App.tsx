import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { buildChatPromptRequest, buildLiveJamRequest } from "./lib/adapters";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled, setFeatureFlag } from "./lib/featureFlags";
import { GenerationOrchestrator } from "./lib/orchestrator";
import type { GenerationResult, MusicGenQualityPreset } from "./lib/types";
import {
  clearInactiveModelCache,
  getModelDurationLimit,
  preloadMusicGenModel,
  setSelectedLocalModel,
  setMusicGenProgressReporter,
  SUPPORTED_LOCAL_MODELS,
} from "./lib/localInference";
import {
  clearPersistedTimeline,
  deletePersistedTimelineEntry,
  loadPersistedTimeline,
  persistTimelineEntry,
} from "./lib/timelineStorage";
import { AppHeader } from "@/components/studio/AppHeader";
import { ChatGeneratePanel } from "@/components/studio/ChatGeneratePanel";
import { AudioVisualizerPanel } from "@/components/studio/AudioVisualizerPanel";
import { GenerationModeSwitch } from "@/components/studio/GenerationModeSwitch";
import { GenerationStatusPanel } from "@/components/studio/GenerationStatusPanel";
import { GenerationTimelinePanel } from "@/components/studio/GenerationTimelinePanel";
import { LiveJamPanel } from "@/components/studio/LiveJamPanel";
import {
  FailedView,
  FallbackView,
  LoadingView,
} from "@/components/studio/ModelStateViews";
import { QualityPresetPanel } from "@/components/studio/QualityPresetPanel";
import {
  CHAT_DURATION_OVERRIDE_STORAGE_KEY,
  HARD_MAX_CHAT_DURATION_SECONDS,
  LANGUAGE_STORAGE_KEY,
  LOCAL_CACHED_MODEL_STORAGE_KEY,
  LOCAL_MODEL_STORAGE_KEY,
  MUSICGEN_QUALITY_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/studio/constants";
import {
  localizeErrorMessage,
  statusToText,
  UI_TEXT,
} from "@/features/studio/content";
import {
  detectSmartChatDurationCap,
  readStoredChatDurationOverride,
  readStoredLanguage,
  readStoredLocalModel,
  readStoredMusicGenQualityPreset,
  readStoredTheme,
} from "@/features/studio/storage";
import {
  exportEntryToGenerationResult,
  generationResultToExportEntry,
  isValidExportedTimelineEntry,
  type ExportedTimelinePayload,
} from "@/features/studio/timelineTransfer";
import type {
  BeforeInstallPromptEvent,
  ModelLoadStatus,
  ThemeMode,
  UiLanguage,
} from "@/features/studio/types";

function scheduleIdleWrite(write: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (
    typeof window.requestIdleCallback === "function" &&
    typeof window.cancelIdleCallback === "function"
  ) {
    const idleId = window.requestIdleCallback(() => {
      write();
    });

    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = globalThis.setTimeout(() => {
    write();
  }, 0);

  return () => {
    globalThis.clearTimeout(timeoutId);
  };
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
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    const storedModel = readStoredLocalModel();
    return (
      SUPPORTED_LOCAL_MODELS.find((model) => model.id === storedModel)?.id ??
      SUPPORTED_LOCAL_MODELS[0].id
    );
  });
  const [modelCacheHint, setModelCacheHint] = useState<string | null>(null);
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
  const [timelineNotice, setTimelineNotice] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<"create" | "visualizer">("create");
  const timelineRef = useRef<GenerationResult[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const ui = UI_TEXT[language];
  const selectedModel =
    SUPPORTED_LOCAL_MODELS.find((model) => model.id === selectedModelId) ??
    SUPPORTED_LOCAL_MODELS[0];
  const selectedModelDurationLimit = getModelDurationLimit(selectedModel.id);

  const isLiveEnabled = isFeatureEnabled("ai-jam-accompaniment");
  const isChatEnabled = isFeatureEnabled("chat-prompt-music-generation");

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    let active = true;

    if (import.meta.env.MODE === "test") {
      return () => {
        active = false;
      };
    }

    void loadPersistedTimeline()
      .then((entries) => {
        if (active && entries.length > 0) {
          setTimeline(entries);
        }
      })
      .catch(() => {
        // Ignore storage errors and keep in-memory timeline only.
      });

    return () => {
      active = false;
      timelineRef.current.forEach((entry) => {
        if (entry.audio?.url?.startsWith("blob:")) {
          URL.revokeObjectURL(entry.audio.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((nextState) => {
      setState(nextState);
      if (nextState.result) {
        const result = nextState.result;
        setTimeline((previous) => [result, ...previous]);

        if (import.meta.env.MODE !== "test") {
          void persistTimelineEntry(result).catch(() => {
            // Keep UI responsive even when persistence fails.
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orchestrator]);

  useEffect(() => {
    let cancelled = false;

    if (import.meta.env.MODE === "test") {
      return () => {
        cancelled = true;
      };
    }

    setSelectedLocalModel(selectedModel.id);
    setModelLoadStatus("loading");
    setModelLoadProgress(0);
    setModelLoadStage("tokenizer");
    setModelLoadError(null);

    const cachedModelId = window.localStorage.getItem(
      LOCAL_CACHED_MODEL_STORAGE_KEY,
    );
    setModelCacheHint(
      cachedModelId === selectedModel.id
        ? ui.modelCacheReady
        : ui.modelCacheCold,
    );

    setMusicGenProgressReporter(({ progress, stage }) => {
      if (cancelled) {
        return;
      }

      const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
      setModelLoadStage(stage);
      setModelLoadProgress(percent);
    });

    void clearInactiveModelCache(selectedModel.id)
      .catch(() => {
        // Keep preload flow resilient even if explicit cache pruning fails.
      })
      .then(() => preloadMusicGenModel(selectedModel.id))
      .then(() => {
        if (!cancelled) {
          window.localStorage.setItem(
            LOCAL_CACHED_MODEL_STORAGE_KEY,
            selectedModel.id,
          );
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
    };
  }, [
    selectedModel.id,
    ui.modelCacheCold,
    ui.modelCacheReady,
    ui.modelLoadFailed,
  ]);

  useEffect(() => {
    return scheduleIdleWrite(() => {
      window.localStorage.setItem(
        MUSICGEN_QUALITY_STORAGE_KEY,
        musicGenQualityPreset,
      );
    });
  }, [musicGenQualityPreset]);

  useEffect(() => {
    return scheduleIdleWrite(() => {
      window.localStorage.setItem(LOCAL_MODEL_STORAGE_KEY, selectedModel.id);
    });
  }, [selectedModel.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", themeMode === "dark");
    document.documentElement.style.colorScheme = themeMode;

    return scheduleIdleWrite(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    });
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.documentElement.lang = language;

    return scheduleIdleWrite(() => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    });
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

  const handleInstallApp = useCallback(async () => {
    if (!installPrompt) {
      setInstallHint(ui.installUnavailable);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallHint(null);
  }, [installPrompt, ui.installUnavailable]);

  const handleToggleTheme = useCallback(() => {
    setThemeMode((currentTheme) =>
      currentTheme === "light" ? "dark" : "light",
    );
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "pl" : "en"));
    setInstallHint(null);
    setTimelineNotice(null);
  }, []);

  const effectiveMode =
    !isLiveEnabled && mode === "live-jam" && isChatEnabled
      ? "chat-generate"
      : !isChatEnabled && mode === "chat-generate" && isLiveEnabled
        ? "live-jam"
        : mode;

  const statusLabel = statusToText(state.status, language);
  const effectiveChatDurationMax = Math.min(
    chatDurationOverride
      ? HARD_MAX_CHAT_DURATION_SECONDS
      : smartChatDurationCap,
    selectedModelDurationLimit,
  );

  useEffect(() => {
    setChatDurationSeconds((currentSeconds) =>
      currentSeconds > effectiveChatDurationMax
        ? effectiveChatDurationMax
        : currentSeconds,
    );
  }, [effectiveChatDurationMax]);

  useEffect(() => {
    return scheduleIdleWrite(() => {
      window.localStorage.setItem(
        CHAT_DURATION_OVERRIDE_STORAGE_KEY,
        chatDurationOverride ? "1" : "0",
      );
    });
  }, [chatDurationOverride]);

  const handleLiveEnable = useCallback(async () => {
    setValidationError(null);
    const request = buildLiveJamRequest({
      sessionId: "session-live",
      notes: liveNotes,
      durationSeconds: liveDurationSeconds,
      musicGenQualityPreset,
      forceFailure: liveFailure,
    });
    await orchestrator.generate(request);
  }, [
    liveDurationSeconds,
    liveFailure,
    liveNotes,
    musicGenQualityPreset,
    orchestrator,
  ]);

  const handleLiveStop = useCallback(() => {
    orchestrator.reset();
    setPlayingId(null);
  }, [orchestrator]);

  const handleChatSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
    },
    [
      chatBpm,
      chatDurationSeconds,
      chatFailure,
      chatIncludeDrums,
      chatInstrumentalOnly,
      chatPrompt,
      language,
      musicGenQualityPreset,
      orchestrator,
      ui.invalidPrompt,
    ],
  );

  const handleDeleteEntry = useCallback(async (entry: GenerationResult) => {
    if (entry.audio?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(entry.audio.url);
    }

    setPlayingId((current) => (current === entry.id ? null : current));
    setTimeline((previous) => previous.filter((item) => item.id !== entry.id));
    setTimelineNotice(null);

    if (import.meta.env.MODE !== "test") {
      await deletePersistedTimelineEntry(entry.id).catch(() => {
        // Keep UI consistent even when persistence delete fails.
      });
    }
  }, []);

  const handleDeleteAllEntries = useCallback(async () => {
    timelineRef.current.forEach((entry) => {
      if (entry.audio?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(entry.audio.url);
      }
    });

    setPlayingId(null);
    setTimeline([]);
    setTimelineNotice(null);

    if (import.meta.env.MODE !== "test") {
      await clearPersistedTimeline().catch(() => {
        // Keep UI consistent even when persistence clear fails.
      });
    }
  }, []);

  const handleExportLibrary = useCallback(async () => {
    setTimelineNotice(null);

    const payload: ExportedTimelinePayload = {
      version: 1,
      exportedAt: Date.now(),
      entries: await Promise.all(
        timelineRef.current.map((entry) =>
          generationResultToExportEntry(entry),
        ),
      ),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const fileDate = new Date(payload.exportedAt)
      .toISOString()
      .replace(/[:.]/g, "-");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `iki-music-library-${fileDate}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportLibraryClick = useCallback(() => {
    setTimelineNotice(null);
    importInputRef.current?.click();
  }, []);

  const handleImportLibrary = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<ExportedTimelinePayload>;

        if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
          throw new Error("Invalid import payload version.");
        }

        const validEntries = parsed.entries.filter(
          isValidExportedTimelineEntry,
        );
        if (validEntries.length !== parsed.entries.length) {
          throw new Error("Import payload contains invalid timeline entries.");
        }

        const restoredTimeline = await Promise.all(
          validEntries.map((entry) => exportEntryToGenerationResult(entry)),
        );
        restoredTimeline.sort((a, b) => b.createdAt - a.createdAt);

        timelineRef.current.forEach((entry) => {
          if (entry.audio?.url?.startsWith("blob:")) {
            URL.revokeObjectURL(entry.audio.url);
          }
        });

        setPlayingId(null);
        setTimeline(restoredTimeline);

        if (import.meta.env.MODE !== "test") {
          await clearPersistedTimeline();
          await Promise.all(
            restoredTimeline.map((entry) => persistTimelineEntry(entry)),
          );
        }

        setTimelineNotice(ui.importCompleted(restoredTimeline.length));
      } catch {
        setTimelineNotice(ui.importInvalid);
      }
    },
    [ui.importCompleted, ui.importInvalid],
  );

  const handleInstallAppClick = useCallback(() => {
    void handleInstallApp();
  }, [handleInstallApp]);

  const handleImportLibraryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      void handleImportLibrary(event);
    },
    [handleImportLibrary],
  );

  const handleExportLibraryClick = useCallback(() => {
    void handleExportLibrary();
  }, [handleExportLibrary]);

  const handleDeleteAllEntriesClick = useCallback(() => {
    void handleDeleteAllEntries();
  }, [handleDeleteAllEntries]);

  const handleDeleteEntryClick = useCallback(
    (entry: GenerationResult) => {
      void handleDeleteEntry(entry);
    },
    [handleDeleteEntry],
  );

  const handleTogglePreview = useCallback((entryId: string) => {
    setPlayingId((current) => (current === entryId ? null : entryId));
  }, []);

  const handleToggleDurationOverride = useCallback(() => {
    setChatDurationOverride((currentOverride) => {
      const nextOverride = !currentOverride;
      if (!nextOverride) {
        setChatDurationSeconds((currentSeconds) =>
          currentSeconds > smartChatDurationCap
            ? smartChatDurationCap
            : currentSeconds,
        );
      }
      return nextOverride;
    });
  }, [smartChatDurationCap]);

  if (modelLoadStatus === "loading") {
    return (
      <LoadingView
        ui={ui}
        themeMode={themeMode}
        installPromptAvailable={Boolean(installPrompt)}
        installHint={installHint}
        onToggleTheme={handleToggleTheme}
        onInstallApp={handleInstallAppClick}
        onToggleLanguage={handleToggleLanguage}
        modelLabel={selectedModel.label}
        modelLoadProgress={modelLoadProgress}
        modelLoadStage={modelLoadStage}
      />
    );
  }

  if (modelLoadStatus === "failed") {
    return (
      <FailedView
        ui={ui}
        themeMode={themeMode}
        installPromptAvailable={Boolean(installPrompt)}
        installHint={installHint}
        onToggleTheme={handleToggleTheme}
        onInstallApp={handleInstallAppClick}
        onToggleLanguage={handleToggleLanguage}
        modelLoadError={modelLoadError}
      />
    );
  }

  if (!isLiveEnabled && !isChatEnabled) {
    return (
      <FallbackView
        ui={ui}
        onReEnable={() => {
          setFeatureFlag("ai-jam-accompaniment", true);
          setFeatureFlag("chat-prompt-music-generation", true);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-16 pt-4 text-slate-900 sm:px-6 lg:px-8 dark:text-slate-100">
      <AppHeader
        ui={ui}
        themeMode={themeMode}
        installPromptAvailable={Boolean(installPrompt)}
        installHint={installHint}
        onToggleTheme={handleToggleTheme}
        onInstallApp={handleInstallAppClick}
        onToggleLanguage={handleToggleLanguage}
      />

      <section className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80">
        <Button
          className="w-full"
          variant={studioTab === "create" ? "default" : "outline"}
          onClick={() => setStudioTab("create")}
        >
          {ui.createTab}
        </Button>
        <Button
          className="w-full"
          variant={studioTab === "visualizer" ? "default" : "outline"}
          onClick={() => setStudioTab("visualizer")}
        >
          {ui.visualizerTab}
        </Button>
      </section>

      {studioTab === "create" ? (
        <>
          <GenerationModeSwitch
            ui={ui}
            isLiveEnabled={isLiveEnabled}
            isChatEnabled={isChatEnabled}
            effectiveMode={effectiveMode}
            onSetMode={setMode}
          />

          <section className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
            <label htmlFor="musicgen-model" className="text-sm font-medium">
              {ui.modelSelector}
            </label>
            <select
              id="musicgen-model"
              value={selectedModel.id}
              onChange={(event) => {
                const nextModel =
                  SUPPORTED_LOCAL_MODELS.find(
                    (model) => model.id === event.target.value,
                  ) ?? SUPPORTED_LOCAL_MODELS[0];
                setSelectedModelId(nextModel.id);
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {SUPPORTED_LOCAL_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
            {modelCacheHint && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {modelCacheHint}
              </p>
            )}
          </section>

          <QualityPresetPanel
            ui={ui}
            language={language}
            musicGenQualityPreset={musicGenQualityPreset}
            onChangePreset={setMusicGenQualityPreset}
          />

          <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/85">
            {effectiveMode === "live-jam" && isLiveEnabled && (
              <LiveJamPanel
                ui={ui}
                liveNotes={liveNotes}
                liveDurationSeconds={liveDurationSeconds}
                liveFailure={liveFailure}
                muted={muted}
                onChangeNotes={setLiveNotes}
                onChangeDuration={setLiveDurationSeconds}
                onChangeFailure={setLiveFailure}
                onEnable={() => {
                  void handleLiveEnable();
                }}
                onToggleMute={() => setMuted((current) => !current)}
                onStop={handleLiveStop}
              />
            )}

            {effectiveMode === "chat-generate" && isChatEnabled && (
              <ChatGeneratePanel
                ui={ui}
                chatPrompt={chatPrompt}
                chatDurationSeconds={chatDurationSeconds}
                effectiveChatDurationMax={effectiveChatDurationMax}
                smartChatDurationCap={smartChatDurationCap}
                chatDurationOverride={chatDurationOverride}
                chatBpm={chatBpm}
                chatInstrumentalOnly={chatInstrumentalOnly}
                chatIncludeDrums={chatIncludeDrums}
                chatFailure={chatFailure}
                validationError={validationError}
                status={state.status}
                onSubmit={handleChatSubmit}
                onChangePrompt={setChatPrompt}
                onChangeDuration={setChatDurationSeconds}
                onToggleDurationOverride={handleToggleDurationOverride}
                onChangeBpm={setChatBpm}
                onChangeInstrumentalOnly={setChatInstrumentalOnly}
                onChangeIncludeDrums={setChatIncludeDrums}
                onChangeFailure={setChatFailure}
              />
            )}
          </section>

          <GenerationStatusPanel ui={ui} statusLabel={statusLabel} />

          {state.error && (
            <section
              className="rounded-2xl border border-red-300 bg-red-50 p-3 text-red-800 shadow-sm"
              role="alert"
            >
              <strong>{ui.error}:</strong>{" "}
              {localizeErrorMessage(state.error.message, language)}
            </section>
          )}

          <GenerationTimelinePanel
            ui={ui}
            timeline={timeline}
            timelineNotice={timelineNotice}
            importInputRef={importInputRef}
            playingId={playingId}
            onImportClick={handleImportLibraryClick}
            onImportChange={handleImportLibraryChange}
            onExport={handleExportLibraryClick}
            onDeleteAll={handleDeleteAllEntriesClick}
            onDeleteEntry={handleDeleteEntryClick}
            onTogglePreview={handleTogglePreview}
          />
        </>
      ) : (
        <AudioVisualizerPanel ui={ui} />
      )}
    </main>
  );
}

export default App;
