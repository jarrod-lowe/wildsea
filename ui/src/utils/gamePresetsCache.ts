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

    if ('data' in result && result.data?.getGamePresets) {
      const presets = result.data.getGamePresets;

      // Cache the result
      cache[cacheKey] = {
        data: presets,
        timestamp: Date.now(),
        language,
      };

      return presets;
    }

    return [];
  } catch (error) {
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