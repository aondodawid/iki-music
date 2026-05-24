import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { HARD_MAX_CHAT_DURATION_SECONDS } from "@/features/studio/constants";
import type { GenerationStatus } from "@/lib/types";
import type { UiText } from "@/features/studio/types";

interface ChatGeneratePanelProps {
  ui: UiText;
  chatPrompt: string;
  chatDurationSeconds: number;
  effectiveChatDurationMax: number;
  smartChatDurationCap: number;
  chatDurationOverride: boolean;
  chatBpm: string;
  chatInstrumentalOnly: boolean;
  chatIncludeDrums: boolean;
  chatFailure: boolean;
  validationError: string | null;
  status: GenerationStatus;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangePrompt: (value: string) => void;
  onChangeDuration: (value: number) => void;
  onToggleDurationOverride: () => void;
  onChangeBpm: (value: string) => void;
  onChangeInstrumentalOnly: (value: boolean) => void;
  onChangeIncludeDrums: (value: boolean) => void;
  onChangeFailure: (value: boolean) => void;
}

export function ChatGeneratePanel({
  ui,
  chatPrompt,
  chatDurationSeconds,
  effectiveChatDurationMax,
  smartChatDurationCap,
  chatDurationOverride,
  chatBpm,
  chatInstrumentalOnly,
  chatIncludeDrums,
  chatFailure,
  validationError,
  status,
  onSubmit,
  onChangePrompt,
  onChangeDuration,
  onToggleDurationOverride,
  onChangeBpm,
  onChangeInstrumentalOnly,
  onChangeIncludeDrums,
  onChangeFailure,
}: ChatGeneratePanelProps) {
  return (
    <>
      <h2 className="text-lg font-medium">{ui.chatPromptGeneration}</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="chat-prompt" className="text-sm font-medium">
          {ui.prompt}
        </label>
        <textarea
          id="chat-prompt"
          value={chatPrompt}
          onChange={(event) => onChangePrompt(event.target.value)}
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
          onChange={(event) => onChangeDuration(Number(event.target.value))}
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
              onClick={onToggleDurationOverride}
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
          onChange={(event) => onChangeBpm(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-sm font-medium">{ui.chatOptions}</p>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={chatInstrumentalOnly}
              onChange={(event) =>
                onChangeInstrumentalOnly(event.target.checked)
              }
            />
            {ui.instrumentalOnly}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={chatIncludeDrums}
              onChange={(event) => onChangeIncludeDrums(event.target.checked)}
            />
            {ui.includeDrums}
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={chatFailure}
            onChange={(event) => onChangeFailure(event.target.checked)}
          />
          {ui.simulateProviderFailure}
        </label>
        <Button type="submit">{ui.generateFromChat}</Button>
      </form>
      {status === "processing" && (
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
  );
}
