import { util, Context } from "@aws-appsync/utils";
import environment from "../../environment.json";
import {
  DDBPrefixGameDefaults,
  DDBPrefixLanguage,
} from "../../lib/constants/dbPrefixes";
import { FallbackLanguage } from "../../lib/constants/defaults";
import type { GameDefaults } from "../../lib/dataTypes";
import type { JoinGameInput } from "../../../appsync/graphql";

export function request(context: Context<{ input: JoinGameInput }>): unknown {
  const gameType = context.prev.result.gameType;
  const language = context.arguments.input.language;

  const keys = [
    util.dynamodb.toMapValues({
      PK: `${DDBPrefixGameDefaults}#${gameType}`,
      SK: `${DDBPrefixLanguage}#${language}`,
    }),
  ];

  // If the requested language is not English, also request English as fallback
  if (language !== FallbackLanguage) {
    keys.push(
      util.dynamodb.toMapValues({
        PK: `${DDBPrefixGameDefaults}#${gameType}`,
        SK: `${DDBPrefixLanguage}#${FallbackLanguage}`,
      }),
    );
  }

  const tableName = "Wildsea-" + environment.name;

  return {
    operation: "BatchGetItem",
    tables: {
      [tableName]: {
        keys: keys,
      },
    },
  };
}

export function response(context: Context<{ input: JoinGameInput }>): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const gameType = context.prev.result.gameType;
  const language = context.arguments.input.language;

  const tableName = "Wildsea-" + environment.name;

  const results = context.result.data[tableName] || [];

  // Try to find the result for the requested language first
  let gameDefaults = results.find(
    (item: Record<string, unknown>) =>
      item && item.SK === `${DDBPrefixLanguage}#${language}`,
  );

  // If not found and language is not English, try English fallback
  if (!gameDefaults && language !== FallbackLanguage) {
    gameDefaults = results.find(
      (item: Record<string, unknown>) =>
        item && item.SK === `${DDBPrefixLanguage}#${FallbackLanguage}`,
    );
  }

  let defaults: GameDefaults;

  // If we have a result from database, use it
  if (gameDefaults) {
    defaults = {
      defaultCharacterName: gameDefaults.defaultCharacterName as string,
      defaultGMName: gameDefaults.defaultGMName as string,
    };
  } else {
    // Final fallback to hardcoded defaults
    defaults =
      gameType === "wildsea"
        ? {
            defaultCharacterName: "Unnamed Character",
            defaultGMName: "Firefly",
          }
        : {
            defaultCharacterName: "Unidentified Agent",
            defaultGMName: "Handler",
          };
  }

  // Store the defaults in stash for the next function to use
  context.stash.gameDefaults = defaults;

  // Pass through the previous result (game data from getGameWithToken)
  return context.prev.result;
}
