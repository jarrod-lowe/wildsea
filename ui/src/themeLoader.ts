/**
 * Theme loader utility for dynamically loading CSS themes based on game type
 */

// Track currently loaded theme to avoid duplicate loads
let currentTheme: string | null = null;

/**
 * Load a CSS theme by theme name
 * @param themeName - The theme name (e.g., 'wildsea', 'deltaGreen', 'default')
 */
export function loadTheme(themeName: string | null | undefined): void {
  const themeToLoad = themeName || 'default';
  
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