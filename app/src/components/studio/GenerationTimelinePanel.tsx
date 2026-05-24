import { memo } from "react";
import type { ChangeEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { UiText } from "@/features/studio/types";
import type { GenerationResult } from "@/lib/types";

interface GenerationTimelinePanelProps {
  ui: UiText;
  timeline: GenerationResult[];
  timelineNotice: string | null;
  importInputRef: RefObject<HTMLInputElement | null>;
  playingId: string | null;
  onImportClick: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onDeleteAll: () => void;
  onDeleteEntry: (entry: GenerationResult) => void;
  onTogglePreview: (entryId: string) => void;
}

export const GenerationTimelinePanel = memo(function GenerationTimelinePanel({
  ui,
  timeline,
  timelineNotice,
  importInputRef,
  playingId,
  onImportClick,
  onImportChange,
  onExport,
  onDeleteAll,
  onDeleteEntry,
  onTogglePreview,
}: GenerationTimelinePanelProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md dark:border-slate-700/70 dark:bg-slate-900/85"
      aria-label={ui.generatedTimeline}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">{ui.generatedResults}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onImportClick}
            aria-label={ui.importLibrary}
          >
            {ui.importLibrary}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            aria-label={ui.exportLibrary}
          >
            {ui.exportLibrary}
          </Button>
          {timeline.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteAll}
              aria-label={ui.deleteAllTracks}
            >
              {ui.deleteAllTracks}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportChange}
      />
      {timelineNotice && (
        <p className="mt-2 rounded-md border border-slate-300 bg-slate-50 p-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {timelineNotice}
        </p>
      )}
      {timeline.length === 0 && <p>{ui.noGenerationsYet}</p>}
      <ul className="mt-2 space-y-2">
        {timeline.map((entry) => (
          <li
            key={entry.id}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm">{entry.content}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => onDeleteEntry(entry)}
                aria-label={ui.deleteTrack}
              >
                {ui.deleteTrack}
              </Button>
            </div>
            {entry.audio ? (
              <audio controls className="mt-2 w-full" src={entry.audio.url}>
                {ui.browserNoAudio}
              </audio>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onTogglePreview(entry.id)}
              >
                {playingId === entry.id ? ui.pausePreview : ui.playPreview}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
});
