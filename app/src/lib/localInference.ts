import { getAiEnvConfig } from "./env";
import type { MusicGenQualityPreset } from "./types";

type TransformersModule = typeof import("@huggingface/transformers");
type AutoTokenizerType = TransformersModule["AutoTokenizer"];
type MusicgenModelType = TransformersModule["MusicgenForConditionalGeneration"];

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
  tokenizer: Awaited<ReturnType<AutoTokenizerType["from_pretrained"]>>;
  model: Awaited<ReturnType<MusicgenModelType["from_pretrained"]>>;
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
const MAX_DURATION_SECONDS = 30;
const DEFAULT_DURATION_SECONDS = 6;
const MUSICGEN_MAX_NEW_TOKENS = 1503;
const MUSICGEN_TOKENS_PER_SECOND =
  MUSICGEN_MAX_NEW_TOKENS / MAX_DURATION_SECONDS;
const MUSICGEN_QUALITY_TOKEN_MULTIPLIER: Record<MusicGenQualityPreset, number> =
  {
    fast: 1,
    balanced: 1,
    quality: 1,
  };
const MUSICGEN_GUIDANCE_SCALE: Record<MusicGenQualityPreset, number> = {
  fast: 2.5,
  balanced: 3,
  quality: 4,
};
let cachedMusicGen: CachedMusicGen | null = null;
let cachedModelName: string | null = null;
let cachedTransformersModulePromise: Promise<TransformersModule> | null = null;

async function getTransformersModule(): Promise<TransformersModule> {
  if (!cachedTransformersModulePromise) {
    cachedTransformersModulePromise = import("@huggingface/transformers");
  }

  return cachedTransformersModulePromise;
}

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
  const estimatedTokens = Math.ceil(
    durationSeconds *
      MUSICGEN_TOKENS_PER_SECOND *
      MUSICGEN_QUALITY_TOKEN_MULTIPLIER[qualityPreset],
  );

  return Math.max(1, Math.min(MUSICGEN_MAX_NEW_TOKENS, estimatedTokens));
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

  const { AutoTokenizer, MusicgenForConditionalGeneration, env } =
    await getTransformersModule();

  const envWithRemoteFlag = env as unknown as { allowRemoteModels?: boolean };
  const envWithRemoteHost = env as unknown as {
    remoteHost?: string;
    remotePathTemplate?: string;
  };

  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const location = (globalThis as { location?: Location }).location;
    if (location?.origin) {
      envWithRemoteHost.remoteHost = `${location.origin}/hf-v2/`;
      envWithRemoteHost.remotePathTemplate = "{model}/resolve/{revision}/";
    }
  }

  const loadFromPretrained = async (
    localFilesOnly: boolean,
  ): Promise<CachedMusicGen> => {
    const tokenizerOptions = {
      local_files_only: localFilesOnly,
      progress_callback: (progress: unknown) =>
        emitProgress("tokenizer", progress),
    } as Record<string, unknown>;

    const modelOptions = {
      local_files_only: localFilesOnly,
      progress_callback: (progress: unknown) => emitProgress("model", progress),
      dtype: {
        text_encoder: "q8",
        decoder_model_merged: "q8",
        encodec_decode: "fp32",
      },
    } as Record<string, unknown>;

    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(
        modelName,
        tokenizerOptions as Parameters<AutoTokenizerType["from_pretrained"]>[1],
      ),
      MusicgenForConditionalGeneration.from_pretrained(
        modelName,
        modelOptions as Parameters<MusicgenModelType["from_pretrained"]>[1],
      ),
    ]);

    return { tokenizer, model };
  };

  const emitProgress = (
    stage: MusicGenLoadProgress["stage"],
    progressInfo: unknown,
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

  // Prefer cached artifacts first; download only when cache is not available yet.
  let loaded: CachedMusicGen | null = null;
  const previousAllowRemoteModels = envWithRemoteFlag.allowRemoteModels;

  try {
    envWithRemoteFlag.allowRemoteModels = false;
    loaded = await loadFromPretrained(true);
  } catch {
    envWithRemoteFlag.allowRemoteModels = true;
    loaded = await loadFromPretrained(false);
  } finally {
    envWithRemoteFlag.allowRemoteModels = previousAllowRemoteModels;
  }

  cachedMusicGen = loaded;
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
  const { RawAudio } = await getTransformersModule();
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
