import type { GenerationRequest, GenerationResult } from "./types";
import { generateWithTransformers } from "./localInference";
import { translateToEnglishIfNeeded } from "./translationApi";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runProviderRequest(
  request: GenerationRequest,
): Promise<GenerationResult> {
  if (request.forceFailure) {
    await wait(150);
    throw new Error("Provider temporary failure");
  }

  const slowPathMs = request.kind === "live-jam" ? 900 : 450;
  await wait(slowPathMs);

  const normalizedPrompt =
    request.kind === "chat-generate"
      ? await translateToEnglishIfNeeded(request.prompt)
      : null;

  const chatPromptWithSettings =
    request.kind === "chat-generate"
      ? [
          normalizedPrompt,
          request.bpm ? `tempo ${request.bpm} bpm` : null,
          request.instrumentalOnly ? "instrumental only" : null,
          request.includeDrums ? "include clear drum groove" : null,
        ]
          .filter((part): part is string => Boolean(part))
          .join(", ")
      : null;

  const localResult =
    request.kind === "live-jam"
      ? await generateWithTransformers({
          prompt: `Accompany this progression: ${request.notes}`,
          durationSeconds: request.durationSeconds,
          qualityPreset: request.musicGenQualityPreset,
        })
      : await generateWithTransformers({
          prompt: chatPromptWithSettings ?? request.prompt,
          durationSeconds: request.durationSeconds,
          qualityPreset: request.musicGenQualityPreset,
        });

  const content = localResult.text;

  return {
    id: `${request.kind}-${Date.now()}`,
    sessionId: request.sessionId,
    mode: request.kind,
    content,
    audio:
      localResult.audioUrl &&
      localResult.audioMimeType &&
      localResult.audioSampleRate
        ? {
            url: localResult.audioUrl,
            mimeType: localResult.audioMimeType,
            sampleRate: localResult.audioSampleRate,
          }
        : undefined,
    createdAt: Date.now(),
  };
}
