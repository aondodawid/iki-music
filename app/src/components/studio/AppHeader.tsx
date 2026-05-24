import { Button } from "@/components/ui/button";
import type { ThemeMode, UiText } from "@/features/studio/types";

interface AppHeaderProps {
  ui: UiText;
  themeMode: ThemeMode;
  installPromptAvailable: boolean;
  installHint: string | null;
  onToggleTheme: () => void;
  onInstallApp: () => void;
  onToggleLanguage: () => void;
}

export function AppHeader({
  ui,
  themeMode,
  installPromptAvailable,
  installHint,
  onToggleTheme,
  onInstallApp,
  onToggleLanguage,
}: AppHeaderProps) {
  return (
    <header className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <Button
            className="h-9 px-3 text-xs sm:text-sm"
            variant="outline"
            onClick={onToggleTheme}
            aria-pressed={themeMode === "dark"}
            aria-label={
              themeMode === "dark" ? ui.switchToLight : ui.switchToDark
            }
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
      </div>
      {installHint && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
          {installHint}
        </p>
      )}
    </header>
  );
}
