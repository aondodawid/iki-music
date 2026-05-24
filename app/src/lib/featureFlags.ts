export type FeatureFlagKey =
  | "ai-jam-accompaniment"
  | "chat-prompt-music-generation";

type FeatureFlags = Record<FeatureFlagKey, boolean>;

const flags: FeatureFlags = {
  "ai-jam-accompaniment": true,
  "chat-prompt-music-generation": true,
};

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return flags[flag];
}

export function setFeatureFlag(flag: FeatureFlagKey, value: boolean): void {
  flags[flag] = value;
}

export function resetFeatureFlags(): void {
  flags["ai-jam-accompaniment"] = true;
  flags["chat-prompt-music-generation"] = true;
}
