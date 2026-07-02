import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import it from "./locales/it.json";
import en from "./locales/en.json";
import lt from "./locales/lt.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      lt: { translation: lt },
    },
    lng: localStorage.getItem("lang") || "it",
    fallbackLng: "it",
    interpolation: { escapeValue: false },
  });

export default i18n;
