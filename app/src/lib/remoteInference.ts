import { HfInference } from "@huggingface/inference";

import { getAiEnvConfig, validateAiEnvForRemote } from "./env";

export interface RemoteInferenceInput {
  prompt: string;
}

export interface RemoteInferenceOutput {
  text: string;
}

export async function generateWithHuggingFace(
  input: RemoteInferenceInput,
): Promise<RemoteInferenceOutput> {
  const config = getAiEnvConfig();

  if (config.useSimulation) {
    return {
      text: `Remote simulated generation for: ${input.prompt}`,
    };
  }

  validateAiEnvForRemote();

  const hf = new HfInference(config.huggingFaceToken);
  const response = await hf.textGeneration({
    model: config.huggingFaceModel,
    inputs: input.prompt,
    parameters: {
      max_new_tokens: 32,
    },
  });

  const text = response.generated_text ?? "";

  if (!text.trim()) {
    throw new Error("Hugging Face returned an empty generation.");
  }

  return { text };
}
