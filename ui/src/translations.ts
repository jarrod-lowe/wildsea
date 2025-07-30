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
