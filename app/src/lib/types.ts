export type GenerationStatus =
  | "idle"
  | "processing"
  | "ready"
  | "degraded"
  | "failed";

export type GenerationMode = "live-jam" | "chat-generate";
export type MusicGenQualityPreset = "fast" | "balanced" | "quality";

export interface LiveJamRequest {
  kind: "live-jam";
  sessionId: string;
  notes: string;
  durationSeconds?: number;
  musicGenQualityPreset?: MusicGenQualityPreset;
  forceFailure?: boolean;
}

export interface ChatPromptRequest {
  kind: "chat-generate";
  sessionId: string;
  prompt: string;
  durationSeconds?: number;
  bpm?: number;
  instrumentalOnly?: boolean;
  includeDrums?: boolean;
  musicGenQualityPreset?: MusicGenQualityPreset;
  forceFailure?: boolean;
}

export type GenerationRequest = LiveJamRequest | ChatPromptRequest;

export interface GenerationAudio {
  url: string;
  mimeType: string;
  sampleRate: number;
}

export interface GenerationResult {
  id: string;
  sessionId: string;
  mode: GenerationMode;
  content: string;
  audio?: GenerationAudio;
  createdAt: number;
}

export interface GenerationErrorPayload {
  code: "PROVIDER_ERROR" | "VALIDATION_ERROR" | "TIMEOUT";
  message: string;
  recoverable: boolean;
}

export interface OrchestratorState {
  status: GenerationStatus;
  result: GenerationResult | null;
  error: GenerationErrorPayload | null;
}
