import type {
  ChatPromptRequest,
  LiveJamRequest,
  MusicGenQualityPreset,
} from "./types";

const MIN_DURATION_SECONDS = 2;
const MAX_DURATION_SECONDS = 12;
const DEFAULT_DURATION_SECONDS = 6;

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
    musicGenQualityPreset: input.musicGenQualityPreset,
    forceFailure: input.forceFailure,
  };
}
