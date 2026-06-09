import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslation from './locales/en/translation.json'
import deTranslation from './locales/de/translation.json'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'

export default i18n
    .use(initReactI18next)
    .use(I18nextBrowserLanguageDetector)
    .init({
        resources: {
            en: { translation: enTranslation },
            de: { translation: deTranslation },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    })
