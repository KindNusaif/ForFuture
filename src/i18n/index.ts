import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ta from './locales/ta.json'
import si from './locales/si.json'

export const LANGUAGE_STORAGE_KEY = 'forfuture_language'
export const SUPPORTED_LANGUAGES = ['en', 'ta', 'si'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'ta' || stored === 'si' || stored === 'en') return stored
  return 'en'
}

function applyDocumentLanguage(lng: string) {
  document.documentElement.lang = lng === 'ta' ? 'ta' : lng === 'si' ? 'si' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    si: { translation: si },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

applyDocumentLanguage(i18n.language)

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  applyDocumentLanguage(lng)
})

export default i18n
