/**
 * Utilities for generating game-specific and language-aware character names
 */

export type SupportedLanguage = string;

export interface CharacterNameTemplates {
  wildsea: string;
  deltaGreen: string;
}

// Character name templates by language
const characterNameTemplates: Record<
  SupportedLanguage,
  CharacterNameTemplates
> = {
  en: {
    wildsea: "Unnamed Character",
    deltaGreen: "Agent #",
  },
  tlh: {
    wildsea: "pagh DIch jup",
    deltaGreen: "jup #",
  },
};

/**
 * Generate a character name based on game type and language
 * @param gameType - The game type (wildsea, deltaGreen, etc.)
 * @param language - The language preference ('en', 'tlh', etc.) - defaults to 'en'
 * @returns Generated character name
 */
export function generateCharacterName(
  gameType: string,
  language?: string,
): string {
  // Default to English if language not supported or not provided
  const supportedLanguage =
    language && isSupportedLanguage(language) ? language : "en";
  const templates = characterNameTemplates[supportedLanguage];

  // Get template for game type, default to wildsea pattern
  const template =
    templates[gameType as keyof CharacterNameTemplates] || templates.wildsea;

  let characterName: string;
  if (gameType === "deltaGreen") {
    // Generate random agent number for Delta Green
    const agentNumber = "" + Math.floor(Math.random() * 900 + 100); // 100-999
    characterName = template + agentNumber;
  } else {
    characterName = template;
  }

  return characterName;
}

/**
 * Check if a language is supported
 * @param language - Language code to check
 * @returns True if language is supported
 */
export function isSupportedLanguage(
  language: string,
): language is SupportedLanguage {
  return characterNameTemplates[language as SupportedLanguage] !== undefined;
}
