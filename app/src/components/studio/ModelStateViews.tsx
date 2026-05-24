import { Button } from "@/components/ui/button";
import type { ThemeMode, UiText } from "@/features/studio/types";

interface BaseViewProps {
  ui: UiText;
  themeMode: ThemeMode;
  installPromptAvailable: boolean;
  installHint: string | null;
  onToggleTheme: () => void;
  onInstallApp: () => void;
  onToggleLanguage: () => void;
}

function Controls({
  ui,
  themeMode,
  installPromptAvailable,
  onToggleTheme,
  onInstallApp,
  onToggleLanguage,
}: Omit<BaseViewProps, "installHint">) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
      <Button
        className="h-9 px-3 text-xs sm:text-sm"
        variant="outline"
        onClick={onToggleTheme}
        aria-pressed={themeMode === "dark"}
        aria-label={themeMode === "dark" ? ui.switchToLight : ui.switchToDark}
      >
        {themeMode === "dark" ? ui.lightMode : ui.darkMode}
      </Button>
      <Button
        className="h-9 px-3 text-xs sm:text-sm"
        variant="outline"
        onClick={onInstallApp}
        tabIndex={installPromptAvailable ? 0 : -1}
      >
        {ui.installApp}
      </Button>
      <Button
        className="h-9 px-3 text-xs sm:text-sm"
        variant="outline"
        onClick={onToggleLanguage}
        aria-label="Switch language"
      >
        {ui.languageButton}
      </Button>
    </div>
  );
}

interface LoadingViewProps extends BaseViewProps {
  modelLabel: string;
  modelLoadProgress: number;
  modelLoadStage: "tokenizer" | "model" | "ready";
}

export function LoadingView({
  ui,
  themeMode,
  installPromptAvailable,
  installHint,
  onToggleTheme,
  onInstallApp,
  onToggleLanguage,
  modelLabel,
  modelLoadProgress,
  modelLoadStage,
}: LoadingViewProps) {
  const progressLabel =
    modelLoadStage === "tokenizer"
      ? ui.downloadingTokenizer
      : modelLoadStage === "model"
        ? ui.downloadingModel
        : ui.modelReady;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
      <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-lg backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/85">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {ui.appTitle}
          </h1>
          <Controls
            ui={ui}
            themeMode={themeMode}
            installPromptAvailable={installPromptAvailable}
            onToggleTheme={onToggleTheme}
            onInstallApp={onInstallApp}
            onToggleLanguage={onToggleLanguage}
          />
        </div>
        {installHint && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
            {installHint}
          </p>
        )}
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          {progressLabel} ({modelLabel})... {modelLoadProgress}%
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

interface FailedViewProps extends BaseViewProps {
  modelLoadError: string | null;
}

export function FailedView({
  ui,
  themeMode,
  installPromptAvailable,
  installHint,
  onToggleTheme,
  onInstallApp,
  onToggleLanguage,
  modelLoadError,
}: FailedViewProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
      <div className="space-y-4 rounded-2xl border border-red-200 bg-white/90 p-5 shadow-lg sm:p-6 dark:border-red-400/70 dark:bg-slate-900/85">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {ui.appTitle}
          </h1>
          <Controls
            ui={ui}
            themeMode={themeMode}
            installPromptAvailable={installPromptAvailable}
            onToggleTheme={onToggleTheme}
            onInstallApp={onInstallApp}
            onToggleLanguage={onToggleLanguage}
          />
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

interface FallbackViewProps {
  ui: UiText;
  onReEnable: () => void;
}

export function FallbackView({ ui, onReEnable }: FallbackViewProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 text-slate-900 sm:px-6 dark:text-slate-100">
      <section className="space-y-4 rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-lg sm:p-6 dark:border-amber-400/70 dark:bg-slate-900/85">
        <h1 className="text-3xl font-semibold tracking-tight">{ui.appTitle}</h1>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {ui.fallbackActive}
        </p>
        <Button variant="outline" onClick={onReEnable}>
          {ui.reEnableAiModes}
        </Button>
      </section>
    </main>
  );
}
