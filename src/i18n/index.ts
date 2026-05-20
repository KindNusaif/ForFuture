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

function lookupEnString(key: string): string | undefined {
  let cur: unknown = en
  for (const part of key.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in (cur as Record<string, unknown>))) {
      return undefined
    }
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    si: { translation: si },
  },
  lng: readStoredLanguage(),
  fallbackLng: {
    si: ['en'],
    ta: ['en'],
    default: ['en'],
  },
  supportedLngs: ['en', 'ta', 'si'],
  nonExplicitSupportedLngs: true,
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  returnNull: false,
  // Never surface raw key paths in the UI
  parseMissingKeyHandler: (key) => {
    const enVal = lookupEnString(key)
    if (enVal) return enVal
    const last = key.split('.').pop() ?? key
    return last.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
  },
})

applyDocumentLanguage(i18n.language)

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  applyDocumentLanguage(lng)
})

export default i18n
