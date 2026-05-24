import type { UiLanguage, UiText } from "@/features/studio/types";
import { DEFAULT_CLIP_SECONDS } from "@/features/studio/constants";
import { MUSICGEN_QUALITY_PRESET_INFO } from "@/features/studio/content";
import type { MusicGenQualityPreset } from "@/lib/types";

interface QualityPresetPanelProps {
  ui: UiText;
  language: UiLanguage;
  musicGenQualityPreset: MusicGenQualityPreset;
  onChangePreset: (preset: MusicGenQualityPreset) => void;
}

export function QualityPresetPanel({
  ui,
  language,
  musicGenQualityPreset,
  onChangePreset,
}: QualityPresetPanelProps) {
  const selectedPresetInfo =
    MUSICGEN_QUALITY_PRESET_INFO[language][musicGenQualityPreset];
  const selectedPresetTokens =
    selectedPresetInfo.tokensPerSecond * DEFAULT_CLIP_SECONDS;

  return (
    <section className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
      <label htmlFor="musicgen-quality" className="text-sm font-medium">
        {ui.speedQualityPreset}
      </label>
      <select
        id="musicgen-quality"
        value={musicGenQualityPreset}
        onChange={(event) =>
          onChangePreset(event.target.value as MusicGenQualityPreset)
        }
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="fast">
          {MUSICGEN_QUALITY_PRESET_INFO[language].fast.label} - ~
          {MUSICGEN_QUALITY_PRESET_INFO[language].fast.tokensPerSecond *
            DEFAULT_CLIP_SECONDS}{" "}
          tokens / 6s
        </option>
        <option value="balanced">
          {MUSICGEN_QUALITY_PRESET_INFO[language].balanced.label} - ~
          {MUSICGEN_QUALITY_PRESET_INFO[language].balanced.tokensPerSecond *
            DEFAULT_CLIP_SECONDS}{" "}
          tokens / 6s
        </option>
        <option value="quality">
          {MUSICGEN_QUALITY_PRESET_INFO[language].quality.label} - ~
          {MUSICGEN_QUALITY_PRESET_INFO[language].quality.tokensPerSecond *
            DEFAULT_CLIP_SECONDS}{" "}
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
  );
}
