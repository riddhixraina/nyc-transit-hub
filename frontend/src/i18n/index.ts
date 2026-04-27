import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import zh from "./locales/zh.json";
import fr from "./locales/fr.json";
import ru from "./locales/ru.json";
import hi from "./locales/hi.json";
import ko from "./locales/ko.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Русский" },
  { code: "hi", label: "हिन्दी" },
  { code: "ko", label: "한국어" },
] as const;

let savedLng: string | null = null;
try {
  savedLng = globalThis.localStorage?.getItem("i18n-lang") ?? null;
} catch {
  // localStorage unavailable in test/SSR environments
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    zh: { translation: zh },
    fr: { translation: fr },
    ru: { translation: ru },
    hi: { translation: hi },
    ko: { translation: ko },
  },
  lng: savedLng || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  try {
    globalThis.localStorage?.setItem("i18n-lang", lng);
  } catch {
    // localStorage unavailable in test/SSR environments
  }
});

export default i18n;
