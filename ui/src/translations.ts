import { diceRollMessagesEnglish } from './rollTranslations.en';
import { diceRollMessagesKlingon } from './rollTranslations.tlh';
import { messagesEnglish } from './translations.en';
import { messagesKlingon } from './translations.tlh';

export const messages = {
  en: {
    ...diceRollMessagesEnglish,
    ...messagesEnglish,
  },
  tlh: {
    ...diceRollMessagesKlingon,
    ...messagesKlingon,
  },
};

// Supported languages with their display information
export const supportedLanguages = {
  auto: {
    code: 'auto',
    name: 'Auto-detect',
    flag: '🌐',
    nativeName: 'Auto-detect',
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    nativeName: 'English',
  },
  tlh: {
    code: 'tlh',
    name: 'Klingon',
    flag: '🖖',
    nativeName: 'tlhIngan Hol',
  },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// Get browser language and find best match
export function detectBrowserLanguage(): Exclude<SupportedLanguage, 'auto'> {
  // Get browser languages in order of preference
  const browserLanguages = navigator.languages || [navigator.language];
  
  // Look for exact matches first
  for (const browserLang of browserLanguages) {
    const langCode = browserLang.toLowerCase().split('-')[0]; // Get language part (e.g., 'en' from 'en-US')
    
    // Check if we support this language (excluding 'auto')
    if (langCode in supportedLanguages && langCode !== 'auto') {
      return langCode as Exclude<SupportedLanguage, 'auto'>;
    }
  }
  
  // Default to English if no supported language found
  return 'en';
}

// Resolve actual language from preference (handling auto-detect)
export function resolveLanguage(languagePreference?: SupportedLanguage): Exclude<SupportedLanguage, 'auto'> {
  if (!languagePreference || languagePreference === 'auto') {
    return detectBrowserLanguage();
  }
  return languagePreference;
}
