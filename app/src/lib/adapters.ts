import type {
  ChatPromptRequest,
  LiveJamRequest,
  MusicGenQualityPreset,
} from "./types";

const MIN_DURATION_SECONDS = 2;
const MAX_DURATION_SECONDS = 120;
const DEFAULT_DURATION_SECONDS = 6;
const MIN_BPM = 60;
const MAX_BPM = 200;

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

function clampBpm(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  const rounded = Math.round(value);
  return Math.max(MIN_BPM, Math.min(MAX_BPM, rounded));
}

export function buildLiveJamRequest(input: {
  sessionId: string;
  notes: string;
  durationSeconds?: number;
  musicGenQualityPreset?: MusicGenQualityPreset;
  forceFailure?: boolean;
}): LiveJamRequest {
  return {
    kind: "live-jam",
    sessionId: input.sessionId,
    notes: input.notes,
    durationSeconds: clampDurationSeconds(input.durationSeconds),
    musicGenQualityPreset: input.musicGenQualityPreset,
    forceFailure: input.forceFailure,
  };
}

export function buildChatPromptRequest(input: {
  sessionId: string;
  prompt: string;
  durationSeconds?: number;
  bpm?: number;
  instrumentalOnly?: boolean;
  includeDrums?: boolean;
  musicGenQualityPreset?: MusicGenQualityPreset;
  forceFailure?: boolean;
}): ChatPromptRequest {
  const prompt = input.prompt.trim();

  if (prompt.length === 0) {
    throw new Error("Prompt cannot be empty.");
  }

  return {
    kind: "chat-generate",
    sessionId: input.sessionId,
    prompt,
    durationSeconds: clampDurationSeconds(input.durationSeconds),
    bpm: clampBpm(input.bpm),
    instrumentalOnly: input.instrumentalOnly,
    includeDrums: input.includeDrums,
    musicGenQualityPreset: input.musicGenQualityPreset,
    forceFailure: input.forceFailure,
  };
}
