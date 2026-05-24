import type { MusicGenQualityPreset } from "@/lib/types";
import {
  CHAT_DURATION_OVERRIDE_STORAGE_KEY,
  HARD_MAX_CHAT_DURATION_SECONDS,
  LANGUAGE_STORAGE_KEY,
  LOCAL_MODEL_STORAGE_KEY,
  MUSICGEN_QUALITY_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "./constants";
import type { ThemeMode, UiLanguage } from "./types";

export function readStoredMusicGenQualityPreset(): MusicGenQualityPreset {
  if (typeof window === "undefined") {
    return "fast";
  }

  const storedPreset = window.localStorage.getItem(
    MUSICGEN_QUALITY_STORAGE_KEY,
  );

  if (
    storedPreset === "fast" ||
    storedPreset === "balanced" ||
    storedPreset === "quality"
  ) {
    return storedPreset;
  }

  return "fast";
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredLanguage(): UiLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage === "pl" || storedLanguage === "en") {
    return storedLanguage;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith("pl") ? "pl" : "en";
}

export function readStoredChatDurationOverride(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(CHAT_DURATION_OVERRIDE_STORAGE_KEY) === "1"
  );
}

export function readStoredLocalModel(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedModel = window.localStorage.getItem(LOCAL_MODEL_STORAGE_KEY);
  return typeof storedModel === "string" && storedModel.length > 0
    ? storedModel
    : null;
}

export function detectSmartChatDurationCap(): number {
  if (typeof window === "undefined") {
    return HARD_MAX_CHAT_DURATION_SECONDS;
  }

  const navigatorWithMemory = window.navigator as Navigator & {
    deviceMemory?: number;
  };
  const memory = navigatorWithMemory.deviceMemory ?? 4;
  const cores = window.navigator.hardwareConcurrency ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
    window.navigator.userAgent,
  );

  if (isMobile || memory <= 4 || cores <= 4) {
    return 10;
  }

  if (memory <= 8 || cores <= 8) {
    return 20;
  }

  return HARD_MAX_CHAT_DURATION_SECONDS;
}
