import { generateClient } from "aws-amplify/api";
import { getGamePresetsQuery } from "../../../appsync/schema";
import type { GamePresetItem } from "../../../appsync/graphql";

interface GamePresetsCache {
  [key: string]: {
    data: GamePresetItem[];
    timestamp: number;
    language: string;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache: GamePresetsCache = {};

function getCacheKey(dataSetName: string, language: string): string {
  return `${dataSetName}#${language}`;
}

function isCacheValid(cacheEntry: { timestamp: number }): boolean {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

// Temporary fallback data for development/testing
const fallbackPresets: Record<string, GamePresetItem[]> = {
  'deltagreen-weapons#en': [
    {
      displayName: 'Glock 17 (9mm pistol)',
      language: 'en',
      data: JSON.stringify({
        name: 'Glock 17',
        description: 'Standard 9mm service pistol',
        skillId: 'Firearms 🔫',
        baseRange: '20m',
        damage: '1d10',
        armorPiercing: '3',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '17'
      })
    },
    {
      displayName: 'M4 Carbine (5.56mm rifle)',
      language: 'en',
      data: JSON.stringify({
        name: 'M4 Carbine',
        description: 'Standard military assault rifle',
        skillId: 'Firearms 🔫',
        baseRange: '150m',
        damage: '1d12',
        armorPiercing: '5',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '30'
      })
    },
    {
      displayName: 'Remington 870 (12-gauge shotgun)',
      language: 'en',
      data: JSON.stringify({
        name: 'Remington 870',
        description: 'Pump-action 12-gauge shotgun',
        skillId: 'Firearms 🔫',
        baseRange: '50m',
        damage: '2d8',
        armorPiercing: '2',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '8'
      })
    }
  ],
  'deltagreen-weapons#tlh': [
    {
      displayName: 'Glock 17 (9mm HIch)',
      language: 'tlh',
      data: JSON.stringify({
        name: 'Glock 17',
        description: 'motlh HIch DIch',
        skillId: 'nuH 🔫',
        baseRange: '20m',
        damage: '1d10',
        armorPiercing: '3',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '17'
      })
    },
    {
      displayName: 'M4 Carbine (5.56mm jup baH)',
      language: 'tlh',
      data: JSON.stringify({
        name: 'M4 Carbine',
        description: 'jup Segh DIch baH',
        skillId: 'nuH 🔫',
        baseRange: '150m',
        damage: '1d12',
        armorPiercing: '5',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '30'
      })
    },
    {
      displayName: 'Remington 870 (12-gauge nugh baH)',
      language: 'tlh',
      data: JSON.stringify({
        name: 'Remington 870',
        description: 'nugh baH tugh',
        skillId: 'nuH 🔫',
        baseRange: '50m',
        damage: '2d8',
        armorPiercing: '2',
        lethality: 'N/A',
        killRadius: 'N/A',
        ammo: '8'
      })
    }
  ]
};

export async function getGamePresets(
  dataSetName: string,
  language: string
): Promise<GamePresetItem[]> {
  const cacheKey = getCacheKey(dataSetName, language);
  const cachedEntry = cache[cacheKey];

  // Return cached data if valid
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return cachedEntry.data;
  }

  try {
    // Fetch from GraphQL API
    const client = generateClient();
    const result = await client.graphql({
      query: getGamePresetsQuery,
      variables: {
        input: {
          dataSetName,
          language,
        },
      },
    });

    if ('data' in result && result.data?.getGamePresets && result.data.getGamePresets.length > 0) {
      const presets = result.data.getGamePresets;

      // Cache the result
      cache[cacheKey] = {
        data: presets,
        timestamp: Date.now(),
        language,
      };

      return presets;
    }

    // Fall back to hardcoded data if API returns empty or fails
    const fallbackKey = `${dataSetName}#${language}`;
    const fallbackData = fallbackPresets[fallbackKey] || [];

    if (fallbackData.length > 0) {
      // Cache the fallback data too
      cache[cacheKey] = {
        data: fallbackData,
        timestamp: Date.now(),
        language,
      };
      return fallbackData;
    }

    return [];
  } catch (error) {
    // Try fallback data
    const fallbackKey = `${dataSetName}#${language}`;
    const fallbackData = fallbackPresets[fallbackKey] || [];

    if (fallbackData.length > 0) {
      return fallbackData;
    }

    // Return cached data even if expired, or empty array
    return cachedEntry?.data || [];
  }
}

export function clearGamePresetsCache(dataSetName?: string, language?: string): void {
  if (dataSetName && language) {
    const cacheKey = getCacheKey(dataSetName, language);
    delete cache[cacheKey];
  } else {
    // Clear all cache
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}

export function preloadGamePresets(
  dataSetName: string,
  language: string
): Promise<GamePresetItem[]> {
  // Preload data in the background, don't await
  return getGamePresets(dataSetName, language);
}