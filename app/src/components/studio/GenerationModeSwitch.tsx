import { Button } from "@/components/ui/button";
import type { UiText } from "@/features/studio/types";
import type { GenerationMode } from "@/lib/types";

interface GenerationModeSwitchProps {
  ui: UiText;
  isLiveEnabled: boolean;
  isChatEnabled: boolean;
  effectiveMode: GenerationMode;
  onSetMode: (mode: GenerationMode) => void;
}

export function GenerationModeSwitch({
  ui,
  isLiveEnabled,
  isChatEnabled,
  effectiveMode,
  onSetMode,
}: GenerationModeSwitchProps) {
  return (
    <section
      className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80"
      aria-label={ui.generationMode}
    >
      {isLiveEnabled && (
        <Button
          variant={effectiveMode === "live-jam" ? "default" : "outline"}
          className="w-full"
          onClick={() => onSetMode("live-jam")}
        >
          {ui.liveJam}
        </Button>
      )}
      {isChatEnabled && (
        <Button
          variant={effectiveMode === "chat-generate" ? "default" : "outline"}
          className="w-full"
          onClick={() => onSetMode("chat-generate")}
        >
          {ui.chatGenerate}
        </Button>
      )}
    </section>
  );
}
