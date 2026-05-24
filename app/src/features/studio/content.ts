import type { MusicGenQualityPreset, GenerationStatus } from "@/lib/types";
import type {
  QualityPresetCatalog,
  StatusTextMap,
  UiLanguage,
  UiText,
} from "./types";

export const UI_TEXT: Record<UiLanguage, UiText> = {
  en: {
    appTitle: "AI Music Studio",
    localPlayground: "Local AI Music Playground",
    appSubtitle: "Create music in live jam mode or from chat prompts.",
    installApp: "Install app",
    installUnavailable:
      "Automatic install is not available yet. Use the browser menu to install this app.",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    languageButton: "PL / EN",
    downloadingTokenizer: "Downloading tokenizer",
    downloadingModel: "Downloading MusicGen model",
    modelReady: "MusicGen ready",
    modelLoadFailed: "Failed to load MusicGen model.",
    fallbackActive:
      "AI generation modes are currently disabled. Fallback mode is active.",
    reEnableAiModes: "Re-enable AI modes",
    generationMode: "Generation mode",
    modelSelector: "Local generation model",
    modelCacheReady: "Model files detected in cache for this profile.",
    modelCacheCold:
      "Model files are not cached yet. They will be downloaded now.",
    liveJam: "Live Jam",
    chatGenerate: "Chat Generate",
    speedQualityPreset: "Speed / quality preset",
    presetSelectedInfo: (label, tokens, guidance) =>
      `${label} is selected. Estimated cost for a 6s clip: ~${tokens} tokens at guidance ${guidance}.`,
    liveAccompaniment: "Live Accompaniment",
    notesProgression: "Notes / progression",
    previewDuration: (seconds) => `Preview duration: ${seconds}s`,
    previewDurationAria: "Preview duration (seconds)",
    simulateProviderFailure: "Simulate provider failure",
    enable: "Enable",
    mute: "Mute",
    unmute: "Unmute",
    chatPromptGeneration: "Chat Prompt Generation",
    prompt: "Prompt",
    generatedClipDuration: (seconds) => `Generated clip duration: ${seconds}s`,
    chatDurationAria: "Chat generated duration (seconds)",
    chatDurationHint:
      "MusicGen is limited to 30 seconds. Longer clips are clamped and may be slower on weaker devices.",
    chatSmartCapInfo: (cap) =>
      `Smart cap detected for this device: ${cap}s. You can still unlock 30s manually.`,
    unlockExtendedDuration: "Unlock 30s",
    restoreSmartCap: "Use smart cap",
    targetBpm: "Target BPM (optional, 60-200)",
    chatOptions: "Chat generation options",
    instrumentalOnly: "Instrumental only",
    includeDrums: "Include drums groove",
    generateFromChat: "Generate from chat",
    generatingResponse: "Generating response...",
    chatProgressAria: "Chat generation progress",
    generationStatus: "Generation status",
    status: "Status",
    error: "Error",
    generatedTimeline: "Generated timeline",
    generatedResults: "Generated Results",
    noGenerationsYet: "No generations yet.",
    deleteTrack: "Delete",
    deleteAllTracks: "Delete all",
    exportLibrary: "Export library",
    importLibrary: "Import library",
    importInvalid: "Invalid library file format.",
    importCompleted: (count) => `Imported tracks: ${count}.`,
    browserNoAudio: "Your browser does not support audio playback.",
    pausePreview: "Pause preview",
    playPreview: "Play preview",
    invalidPrompt: "Invalid prompt",
    emptyPrompt: "Prompt cannot be empty.",
    providerTemporaryFailure: "Provider temporary failure",
  },
  pl: {
    appTitle: "Studio Muzyki AI",
    localPlayground: "Lokalne Studio Muzyczne AI",
    appSubtitle: "Tworz muzyke w trybie live jam albo z promptow czatu.",
    installApp: "Zainstaluj aplikacje",
    installUnavailable:
      "Automatyczna instalacja nie jest jeszcze dostepna. Uzyj menu przegladarki, aby zainstalowac te aplikacje.",
    switchToLight: "Przelacz na jasny motyw",
    switchToDark: "Przelacz na ciemny motyw",
    lightMode: "Jasny motyw",
    darkMode: "Ciemny motyw",
    languageButton: "EN / PL",
    downloadingTokenizer: "Pobieranie tokenizera",
    downloadingModel: "Pobieranie modelu MusicGen",
    modelReady: "MusicGen gotowy",
    modelLoadFailed: "Nie udalo sie zaladowac modelu MusicGen.",
    fallbackActive:
      "Tryby generowania AI sa obecnie wylaczone. Aktywny jest tryb awaryjny.",
    reEnableAiModes: "Wlacz ponownie tryby AI",
    generationMode: "Tryb generowania",
    modelSelector: "Model lokalnej generacji",
    modelCacheReady: "Pliki modelu sa juz w cache dla tego profilu.",
    modelCacheCold:
      "Pliki modelu nie sa jeszcze w cache. Zostana pobrane teraz.",
    liveJam: "Live Jam",
    chatGenerate: "Generowanie z czatu",
    speedQualityPreset: "Preset szybkosci / jakosci",
    presetSelectedInfo: (label, tokens, guidance) =>
      `Wybrano ${label}. Szacowany koszt dla klipu 6s: ~${tokens} tokenow przy guidance ${guidance}.`,
    liveAccompaniment: "Akompaniament na zywo",
    notesProgression: "Nuty / progresja",
    previewDuration: (seconds) => `Dlugosc podgladu: ${seconds}s`,
    previewDurationAria: "Dlugosc podgladu (sekundy)",
    simulateProviderFailure: "Symuluj blad providera",
    enable: "Wlacz",
    mute: "Wycisz",
    unmute: "Odlacz wyciszenie",
    chatPromptGeneration: "Generowanie z promptu czatu",
    prompt: "Prompt",
    generatedClipDuration: (seconds) =>
      `Dlugosc generowanego klipu: ${seconds}s`,
    chatDurationAria: "Dlugosc utworu z czatu (sekundy)",
    chatDurationHint:
      "MusicGen ma limit 30 sekund. Dluzsze klipy sa przycinane i moga dzialac wolniej na slabszych urzadzeniach.",
    chatSmartCapInfo: (cap) =>
      `Wykryto smart cap dla tego urzadzenia: ${cap}s. Nadal mozesz recznie odblokowac 30s.`,
    unlockExtendedDuration: "Odblokuj 30s",
    restoreSmartCap: "Uzyj smart cap",
    targetBpm: "Docelowe BPM (opcjonalnie, 60-200)",
    chatOptions: "Opcje generowania czatu",
    instrumentalOnly: "Tylko instrumental",
    includeDrums: "Dodaj groove perkusyjny",
    generateFromChat: "Generuj z czatu",
    generatingResponse: "Generowanie odpowiedzi...",
    chatProgressAria: "Postep generowania z czatu",
    generationStatus: "Status generowania",
    status: "Status",
    error: "Blad",
    generatedTimeline: "Osi czasu generacji",
    generatedResults: "Wygenerowane wyniki",
    noGenerationsYet: "Brak wygenerowanych wynikow.",
    deleteTrack: "Usun",
    deleteAllTracks: "Usun wszystko",
    exportLibrary: "Eksportuj biblioteke",
    importLibrary: "Importuj biblioteke",
    importInvalid: "Nieprawidlowy format pliku biblioteki.",
    importCompleted: (count) => `Zaimportowane utwory: ${count}.`,
    browserNoAudio: "Twoja przegladarka nie obsluguje odtwarzania audio.",
    pausePreview: "Wstrzymaj podglad",
    playPreview: "Odtworz podglad",
    invalidPrompt: "Nieprawidlowy prompt",
    emptyPrompt: "Prompt nie moze byc pusty.",
    providerTemporaryFailure: "Tymczasowa awaria providera",
  },
};

export const MUSICGEN_QUALITY_PRESET_INFO: QualityPresetCatalog = {
  en: {
    fast: { label: "Fast draft", tokensPerSecond: 50, guidanceScale: 2.5 },
    balanced: { label: "Balanced", tokensPerSecond: 50, guidanceScale: 3 },
    quality: { label: "Better quality", tokensPerSecond: 50, guidanceScale: 4 },
  },
  pl: {
    fast: { label: "Szybki szkic", tokensPerSecond: 50, guidanceScale: 2.5 },
    balanced: { label: "Balans", tokensPerSecond: 50, guidanceScale: 3 },
    quality: { label: "Lepsza jakosc", tokensPerSecond: 50, guidanceScale: 4 },
  },
};

const STATUS_TEXT_MAP: StatusTextMap = {
  en: {
    idle: "Idle",
    processing: "Processing",
    ready: "Ready",
    degraded: "Degraded - high latency",
    failed: "Failed",
  },
  pl: {
    idle: "Bezczynny",
    processing: "Przetwarzanie",
    ready: "Gotowe",
    degraded: "Ograniczony - duza latencja",
    failed: "Niepowodzenie",
  },
};

export function statusToText(
  status: GenerationStatus,
  language: UiLanguage,
): string {
  return STATUS_TEXT_MAP[language][status];
}

export function localizeErrorMessage(
  message: string,
  language: UiLanguage,
): string {
  const ui = UI_TEXT[language];

  if (message === "Prompt cannot be empty.") {
    return ui.emptyPrompt;
  }

  if (message === "Provider temporary failure") {
    return ui.providerTemporaryFailure;
  }

  if (message === "Invalid prompt") {
    return ui.invalidPrompt;
  }

  return message;
}

export function getPresetLabel(
  language: UiLanguage,
  preset: MusicGenQualityPreset,
): string {
  return MUSICGEN_QUALITY_PRESET_INFO[language][preset].label;
}
