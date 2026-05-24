import {
  AutoTokenizer,
  MusicgenForConditionalGeneration,
  RawAudio,
} from "@huggingface/transformers";

import { getAiEnvConfig } from "./env";
import type { ProgressInfo } from "@huggingface/transformers";
import type { MusicGenQualityPreset } from "./types";

export interface LocalInferenceInput {
  prompt: string;
  durationSeconds?: number;
  qualityPreset?: MusicGenQualityPreset;
}

export interface LocalInferenceOutput {
  text: string;
  audioUrl?: string;
  audioMimeType?: string;
  audioSampleRate?: number;
}

interface CachedMusicGen {
  tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>;
  model: Awaited<
    ReturnType<typeof MusicgenForConditionalGeneration.from_pretrained>
  >;
}

export interface MusicGenLoadProgress {
  progress: number;
  loaded: number;
  total: number;
  stage: "tokenizer" | "model";
}

type MusicGenProgressCallback = (progress: MusicGenLoadProgress) => void;
const ESTIMATED_MUSICGEN_MODEL_BYTES = 110443015 + 428422300 + 118056304;
const ESTIMATED_MUSICGEN_MODEL_MIB = (
  ESTIMATED_MUSICGEN_MODEL_BYTES /
  (1024 * 1024)
).toFixed(1);

const WAV_MIME_TYPE = "audio/wav";
const MIN_DURATION_SECONDS = 2;
const MAX_DURATION_SECONDS = 120;
const DEFAULT_DURATION_SECONDS = 6;
const MUSICGEN_TOKENS_PER_SECOND: Record<MusicGenQualityPreset, number> = {
  fast: 4,
  balanced: 6,
  quality: 8,
};
const MUSICGEN_GUIDANCE_SCALE: Record<MusicGenQualityPreset, number> = {
  fast: 2.5,
  balanced: 3,
  quality: 4,
};
let cachedMusicGen: CachedMusicGen | null = null;
let cachedModelName: string | null = null;

function clampDurationSeconds(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_DURATION_SECONDS;
  }

  const rounded = Math.round(value);
  return Math.max(
    MIN_DURATION_SECONDS,
    Math.min(MAX_DURATION_SECONDS, rounded),
  );
}

function estimateMusicGenTokensForPreset(
  durationSeconds: number,
  qualityPreset: MusicGenQualityPreset,
): number {
  return Math.max(
    1,
    Math.floor(durationSeconds * MUSICGEN_TOKENS_PER_SECOND[qualityPreset]),
  );
}

async function getMusicGen(modelName: string): Promise<CachedMusicGen> {
  let progressReporter: MusicGenProgressCallback | null = null;

  if (typeof globalThis !== "undefined") {
    const maybeReporter = (
      globalThis as { __musicGenProgressReporter?: unknown }
    ).__musicGenProgressReporter;
    if (typeof maybeReporter === "function") {
      progressReporter = maybeReporter as (
        progress: MusicGenLoadProgress,
      ) => void;
    }
  }

  if (cachedMusicGen && cachedModelName === modelName) {
    return cachedMusicGen;
  }

  const emitProgress = (
    stage: MusicGenLoadProgress["stage"],
    progressInfo: ProgressInfo,
  ): void => {
    if (!progressReporter) {
      return;
    }

    const payload = progressInfo as Record<string, unknown>;

    const loaded = typeof payload.loaded === "number" ? payload.loaded : 0;
    const total = typeof payload.total === "number" ? payload.total : 0;
    const progressValue =
      typeof payload.progress === "number" ? payload.progress : undefined;

    const percent =
      typeof progressValue === "number"
        ? progressValue
        : total > 0
          ? loaded / total
          : 0;

    progressReporter({
      progress: percent,
      loaded,
      total,
      stage,
    });
  };

  const tokenizer = await AutoTokenizer.from_pretrained(modelName, {
    progress_callback: (progress) => emitProgress("tokenizer", progress),
  });
  const model = await MusicgenForConditionalGeneration.from_pretrained(
    modelName,
    {
      progress_callback: (progress) => emitProgress("model", progress),
      dtype: {
        text_encoder: "q8",
        decoder_model_merged: "q8",
        encodec_decode: "fp32",
      },
    },
  );

  cachedMusicGen = {
    tokenizer,
    model,
  };
  cachedModelName = modelName;

  return cachedMusicGen;
}

export async function preloadMusicGenModel(): Promise<void> {
  const config = getAiEnvConfig();

  if (config.useSimulation) {
    return;
  }

  console.log(
    `MusicGen model estimate: ~${ESTIMATED_MUSICGEN_MODEL_MIB} MiB for ${config.transformersModel}.`,
  );

  await getMusicGen(config.transformersModel);
}

export function setMusicGenProgressReporter(
  reporter: ((progress: MusicGenLoadProgress) => void) | null,
): void {
  (
    globalThis as { __musicGenProgressReporter?: unknown }
  ).__musicGenProgressReporter = reporter ?? undefined;
}

export async function generateWithTransformers(
  input: LocalInferenceInput,
): Promise<LocalInferenceOutput> {
  const config = getAiEnvConfig();
  const durationSeconds = clampDurationSeconds(input.durationSeconds);
  const qualityPreset = input.qualityPreset ?? "fast";
  const maxNewTokens = estimateMusicGenTokensForPreset(
    durationSeconds,
    qualityPreset,
  );

  if (config.useSimulation) {
    return {
      text: `Local simulated MusicGen output for: ${input.prompt} (${durationSeconds}s)`,
    };
  }

  const { tokenizer, model } = await getMusicGen(config.transformersModel);
  const inputs = tokenizer(input.prompt);
  const audioValues = await model.generate({
    ...inputs,
    max_new_tokens: maxNewTokens,
    do_sample: true,
    guidance_scale: MUSICGEN_GUIDANCE_SCALE[qualityPreset],
  });

  const configWithRate = model.config as {
    audio_encoder?: {
      sampling_rate?: number;
    };
  };

  const samplingRate = configWithRate.audio_encoder?.sampling_rate ?? 32000;
  const allSamples =
    typeof audioValues === "object" &&
    audioValues !== null &&
    "data" in audioValues &&
    audioValues.data instanceof Float32Array
      ? audioValues.data
      : (() => {
          throw new Error("MusicGen did not return audio waveform data.");
        })();
  const sampleLimit = Math.max(1, Math.floor(samplingRate * durationSeconds));
  const samples =
    allSamples.length > sampleLimit
      ? allSamples.slice(0, sampleLimit)
      : allSamples;

  const audio = new RawAudio(samples, samplingRate);
  const audioUrl = URL.createObjectURL(audio.toBlob());

  const generatedText = `Generated local accompaniment for: ${input.prompt} (${durationSeconds}s)`;

  return {
    text: generatedText,
    audioUrl,
    audioMimeType: WAV_MIME_TYPE,
    audioSampleRate: samplingRate,
  };
}
