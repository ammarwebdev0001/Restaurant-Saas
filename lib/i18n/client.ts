import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources, UI_LANG_STORAGE_KEY, type UiLanguage } from '@/lib/i18n/resources';

function detectLanguage(): UiLanguage {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem(UI_LANG_STORAGE_KEY);
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });
}

export function setUiLanguage(lang: UiLanguage) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
  }
  void i18n.changeLanguage(lang);
}

export { i18n };

