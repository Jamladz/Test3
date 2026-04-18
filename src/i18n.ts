import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: {
        adError: "Ad failed",
        adNotReady: "Ad not ready",
        withdraw: "Withdraw",
        withdrawMin: "Min 10,000 required."
    } }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
