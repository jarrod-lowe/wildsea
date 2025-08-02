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
    "game.unknownType": "Unknown type",
    "game.invalidType": "Invalid game type",
    "settings.sizeExceeded": "Settings exceed size limit",
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
    "game.unknownType": "Sovbe'ghach Segh",
    "game.invalidType": "nugh DIch lo'taHbe'",
    "settings.sizeExceeded": "nugh DIch nugh DIch lo'taHbe'",
  },
};

/**
 * Get a translated error message with optional value concatenation
 * @param messageKey - The message key to translate
 * @param language - The target language (defaults to 'en' if not supported)
 * @param value - Optional value to append after ": " (e.g. "Invalid game type: someValue")
 * @returns The translated message, falling back to English if translation not found
 */
export function getTranslatedMessage(
  messageKey: string,
  language: string = defaultLanguage,
  value?: string,
): string {
  // Try to get the requested language
  let message = translations[language]?.[messageKey];

  // Fall back to English if not found
  if (!message) {
    message = translations[defaultLanguage]?.[messageKey];
  }

  // Ultimate fallback - return messageKey: value format
  if (!message) {
    return value ? messageKey + ": " + value : messageKey;
  }

  // Append value if provided (format: "message: value")
  if (value) {
    message = message + ": " + value;
  }

  return message;
}

/**
 * Get supported languages for error messages
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(translations);
}
