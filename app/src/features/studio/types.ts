import type {
  GenerationMode,
  GenerationStatus,
  MusicGenQualityPreset,
} from "@/lib/types";

export type ModelLoadStatus = "loading" | "ready" | "failed";
export type ThemeMode = "light" | "dark";
export type UiLanguage = "pl" | "en";

export interface UiText {
  appTitle: string;
  localPlayground: string;
  appSubtitle: string;
  installApp: string;
  installUnavailable: string;
  switchToLight: string;
  switchToDark: string;
  lightMode: string;
  darkMode: string;
  languageButton: string;
  downloadingTokenizer: string;
  downloadingModel: string;
  modelReady: string;
  modelLoadFailed: string;
  fallbackActive: string;
  reEnableAiModes: string;
  generationMode: string;
  modelSelector: string;
  modelCacheReady: string;
  modelCacheCold: string;
  liveJam: string;
  chatGenerate: string;
  speedQualityPreset: string;
  presetSelectedInfo: (
    label: string,
    tokens: number,
    guidance: number,
  ) => string;
  liveAccompaniment: string;
  notesProgression: string;
  previewDuration: (seconds: number) => string;
  previewDurationAria: string;
  simulateProviderFailure: string;
  enable: string;
  mute: string;
  unmute: string;
  chatPromptGeneration: string;
  prompt: string;
  generatedClipDuration: (seconds: number) => string;
  chatDurationAria: string;
  chatDurationHint: string;
  chatSmartCapInfo: (cap: number) => string;
  unlockExtendedDuration: string;
  restoreSmartCap: string;
  targetBpm: string;
  chatOptions: string;
  instrumentalOnly: string;
  includeDrums: string;
  generateFromChat: string;
  generatingResponse: string;
  chatProgressAria: string;
  generationStatus: string;
  status: string;
  error: string;
  generatedTimeline: string;
  generatedResults: string;
  audioVisualizer: string;
  visualizerMode: string;
  visualizer2d: string;
  visualizer3d: string;
  visualizerTrack: string;
  visualizerNoAudio: string;
  visualizerHint: string;
  noGenerationsYet: string;
  deleteTrack: string;
  deleteAllTracks: string;
  exportLibrary: string;
  importLibrary: string;
  importInvalid: string;
  importCompleted: (count: number) => string;
  browserNoAudio: string;
  pausePreview: string;
  playPreview: string;
  invalidPrompt: string;
  emptyPrompt: string;
  providerTemporaryFailure: string;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export interface QualityPresetInfo {
  label: string;
  tokensPerSecond: number;
  guidanceScale: number;
}

export type QualityPresetCatalog = Record<
  UiLanguage,
  Record<MusicGenQualityPreset, QualityPresetInfo>
>;

export type StatusTextMap = Record<
  UiLanguage,
  Record<GenerationStatus, string>
>;

export type GeneratedMode = GenerationMode;
