import type { GenerationResult } from "@/lib/types";

export interface ExportedTimelineEntry {
  id: string;
  sessionId: string;
  mode: GenerationResult["mode"];
  content: string;
  createdAt: number;
  audioMimeType?: string;
  audioSampleRate?: number;
  audioDataUrl?: string;
}

export interface ExportedTimelinePayload {
  version: 1;
  exportedAt: number;
  entries: ExportedTimelineEntry[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read audio blob."));
    };

    reader.onload = () => {
      const value = reader.result;
      if (typeof value === "string") {
        resolve(value);
        return;
      }

      reject(new Error("Failed to encode audio blob."));
    };

    reader.readAsDataURL(blob);
  });
}

export async function generationResultToExportEntry(
  entry: GenerationResult,
): Promise<ExportedTimelineEntry> {
  let audioDataUrl: string | undefined;

  if (entry.audio?.url) {
    try {
      const response = await fetch(entry.audio.url);
      if (response.ok) {
        const blob = await response.blob();
        audioDataUrl = await blobToDataUrl(blob);
      }
    } catch {
      audioDataUrl = undefined;
    }
  }

  return {
    id: entry.id,
    sessionId: entry.sessionId,
    mode: entry.mode,
    content: entry.content,
    createdAt: entry.createdAt,
    audioMimeType: entry.audio?.mimeType,
    audioSampleRate: entry.audio?.sampleRate,
    audioDataUrl,
  };
}

export function isValidExportedTimelineEntry(
  value: unknown,
): value is ExportedTimelineEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ExportedTimelineEntry>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.sessionId === "string" &&
    (candidate.mode === "live-jam" || candidate.mode === "chat-generate") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "number" &&
    (candidate.audioMimeType === undefined ||
      typeof candidate.audioMimeType === "string") &&
    (candidate.audioSampleRate === undefined ||
      typeof candidate.audioSampleRate === "number") &&
    (candidate.audioDataUrl === undefined ||
      typeof candidate.audioDataUrl === "string")
  );
}

export async function exportEntryToGenerationResult(
  entry: ExportedTimelineEntry,
): Promise<GenerationResult> {
  let audio:
    | {
        url: string;
        mimeType: string;
        sampleRate: number;
      }
    | undefined;

  if (entry.audioDataUrl && entry.audioMimeType && entry.audioSampleRate) {
    const response = await fetch(entry.audioDataUrl);
    const blob = await response.blob();

    audio = {
      url: URL.createObjectURL(blob),
      mimeType: entry.audioMimeType,
      sampleRate: entry.audioSampleRate,
    };
  }

  return {
    id: entry.id,
    sessionId: entry.sessionId,
    mode: entry.mode,
    content: entry.content,
    createdAt: entry.createdAt,
    audio,
  };
}
