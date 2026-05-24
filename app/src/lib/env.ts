function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export interface AiEnvConfig {
  useSimulation: boolean;
  huggingFaceToken?: string;
  huggingFaceModel: string;
  transformersModel: string;
}

export function getAiEnvConfig(): AiEnvConfig {
  const useSimulation =
    import.meta.env.VITE_AI_SIMULATE === "true" ||
    import.meta.env.MODE === "test";
  const huggingFaceToken = import.meta.env.VITE_HF_TOKEN;

  return {
    useSimulation,
    huggingFaceToken: isNonEmpty(huggingFaceToken)
      ? huggingFaceToken
      : undefined,
    huggingFaceModel: import.meta.env.VITE_HF_MODEL ?? "openai-community/gpt2",
    transformersModel:
      import.meta.env.VITE_TRANSFORMERS_MODEL ?? "facebook/musicgen-small",
  };
}

export function validateAiEnvForRemote(): void {
  const config = getAiEnvConfig();

  if (config.useSimulation) {
    return;
  }

  if (!config.huggingFaceToken) {
    throw new Error(
      "Missing VITE_HF_TOKEN. Set token or enable simulation mode with VITE_AI_SIMULATE=true.",
    );
  }
}
