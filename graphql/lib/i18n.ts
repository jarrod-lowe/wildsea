// Simple i18n utility for APPSYNC_JS environment
// Since APPSYNC_JS has limited JavaScript features, we keep this simple and lightweight

const defaultLanguage = "en";

interface TranslationsByLanguage {
  [language: string]: {
    [messageKey: string]: string;
  };
}

// Error message translations organized by language
// This structure makes it easier for translators to work on a specific language
const translations: TranslationsByLanguage = {
  en: {
    "joinGame.cannotJoinOwnGame": "You cannot join your own game",
    "joinGame.alreadyPlayer": "You are already a player in this game",
    "template.notFound": "Template not found",
    "player.cannotDelete": "Cannot delete firefly sheet",
    "game.notFound": "Game not found",
    "sheet.notFound": "Sheet not found",
    "gameRecord.notFound": "Game record not found",
    "gameDefaults.missing": "Game defaults not found in stash",
  },
  tlh: {
    // Klingon translations - these are placeholders and would need proper translation
    "joinGame.cannotJoinOwnGame": "nugh DIch DIch DIlo'meH DIch DIch",
    "joinGame.alreadyPlayer": "DIch naQ DIch DIch",
    "template.notFound": "nugh DIch tu'lu'be'",
    "player.cannotDelete": "DIch DIch lan DIch",
    "game.notFound": "nugh DIch tu'lu'be'",
    "sheet.notFound": "naQ DIch tu'lu'be'",
    "gameRecord.notFound": "nugh DIch teywI' tu'lu'be'",
    "gameDefaults.missing": "nugh DIch nugh DIch polmeH DIch tu'lu'be'",
  },
};

/**
 * Get a translated error message
 * @param messageKey - The message key to translate
 * @param language - The target language (defaults to 'en' if not supported)
 * @returns The translated message, falling back to English if translation not found
 */
export function getTranslatedMessage(
  messageKey: string,
  language: string = defaultLanguage,
): string {
  // Try to get the requested language
  const languageTranslations = translations[language];
  if (languageTranslations && languageTranslations[messageKey]) {
    return languageTranslations[messageKey];
  }

  // Fall back to English
  const defaultTranslations = translations[defaultLanguage];
  if (defaultTranslations && defaultTranslations[messageKey]) {
    return defaultTranslations[messageKey];
  }

  // Ultimate fallback - return the message key
  return messageKey;
}

/**
 * Get supported languages for error messages
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(translations);
}
