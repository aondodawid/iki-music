import type { UiText } from "@/features/studio/types";

interface GenerationStatusPanelProps {
  ui: UiText;
  statusLabel: string;
}

export function GenerationStatusPanel({
  ui,
  statusLabel,
}: GenerationStatusPanelProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/85"
      role="status"
      aria-live="polite"
      aria-label={ui.generationStatus}
    >
      <strong>{ui.status}:</strong> {statusLabel}
    </section>
  );
}
