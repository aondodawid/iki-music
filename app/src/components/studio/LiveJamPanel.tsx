import { Button } from "@/components/ui/button";
import type { UiText } from "@/features/studio/types";

interface LiveJamPanelProps {
  ui: UiText;
  liveNotes: string;
  liveDurationSeconds: number;
  liveFailure: boolean;
  muted: boolean;
  onChangeNotes: (value: string) => void;
  onChangeDuration: (value: number) => void;
  onChangeFailure: (value: boolean) => void;
  onEnable: () => void;
  onToggleMute: () => void;
  onStop: () => void;
}

export function LiveJamPanel({
  ui,
  liveNotes,
  liveDurationSeconds,
  liveFailure,
  muted,
  onChangeNotes,
  onChangeDuration,
  onChangeFailure,
  onEnable,
  onToggleMute,
  onStop,
}: LiveJamPanelProps) {
  return (
    <>
      <h2 className="text-lg font-medium">{ui.liveAccompaniment}</h2>
      <label htmlFor="live-notes" className="text-sm font-medium">
        {ui.notesProgression}
      </label>
      <input
        id="live-notes"
        value={liveNotes}
        onChange={(event) => onChangeNotes(event.target.value)}
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
        onChange={(event) => onChangeDuration(Number(event.target.value))}
        aria-label={ui.previewDurationAria}
      />
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={liveFailure}
          onChange={(event) => onChangeFailure(event.target.checked)}
        />
        {ui.simulateProviderFailure}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          className="w-full sm:w-auto"
          onClick={onEnable}
          aria-label="Enable accompaniment"
        >
          {ui.enable}
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          onClick={onToggleMute}
          aria-label="Mute accompaniment"
        >
          {muted ? ui.unmute : ui.mute}
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="outline"
          onClick={onStop}
          aria-label="Stop accompaniment"
        >
          Stop
        </Button>
      </div>
    </>
  );
}
