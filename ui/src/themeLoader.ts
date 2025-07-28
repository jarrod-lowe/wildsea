/**
 * Theme loader utility for dynamically loading CSS themes based on game type
 */

// Track currently loaded theme to avoid duplicate loads
let currentTheme: string | null = null;

/**
 * Load a CSS theme by game type
 * @param gameType - The game type (e.g., 'wildsea', 'deltaGreen')
 */
export function loadTheme(gameType: string | null | undefined): void {
  const themeToLoad = getThemeForGameType(gameType);
  
  // Don't reload if it's already the current theme
  if (currentTheme === themeToLoad) {
    return;
  }
  
  // Remove existing theme link if it exists
  const existingThemeLink = document.querySelector('link[data-theme]');
  if (existingThemeLink) {
    existingThemeLink.remove();
  }
  
  // Create and append new theme link
  const themeLink = document.createElement('link');
  themeLink.rel = 'stylesheet';
  themeLink.href = `/themes/${themeToLoad}.css`;
  themeLink.setAttribute('data-theme', themeToLoad);
  
  // Insert before the main stylesheet to ensure proper cascade
  const mainStyleLink = document.querySelector('link[href="/style.css"]');
  if (mainStyleLink) {
    mainStyleLink.parentNode?.insertBefore(themeLink, mainStyleLink);
  } else {
    document.head.appendChild(themeLink);
  }
  
  currentTheme = themeToLoad;
}

/**
 * Get the appropriate theme name for a game type
 * @param gameType - The game type
 * @returns The theme name to use
 */
function getThemeForGameType(gameType: string | null | undefined): string {
  switch (gameType) {
    case 'wildsea':
      return 'wildsea';
    case 'deltaGreen':
      return 'deltaGreen';
    default:
      return 'default';
  }
}

/**
 * Load the default theme (for non-game screens)
 */
export function loadDefaultTheme(): void {
  loadTheme(null);
}

/**
 * Get the currently loaded theme name
 */
export function getCurrentTheme(): string | null {
  return currentTheme;
}