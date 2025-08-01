import { util, Context } from "@aws-appsync/utils";
import environment from "../../environment.json";
import { DDBPrefixGameDefaults } from "../../lib/constants/dbPrefixes";
import { FallbackLanguage } from "../../lib/constants/defaults";
import type { GameDefaults, DynamoDBGameDefaults } from "../../lib/dataTypes";
import type { JoinGameInput, CreateGameInput } from "../../../appsync/graphql";

export function request(
  context: Context<{ input: JoinGameInput | CreateGameInput }>,
): unknown {
  // Get gameType from previous result (joinGame) or from input (createGame)
  const gameType =
    context.prev?.result?.gameType ||
    (context.arguments.input as CreateGameInput).gameType;
  const language = context.arguments.input.language;

  const keys = [
    util.dynamodb.toMapValues({
      PK: `${DDBPrefixGameDefaults}#${language}`,
      SK: `${DDBPrefixGameDefaults}#${gameType}`,
    }),
  ];

  // If the requested language is not English, also request English as fallback
  if (language !== FallbackLanguage) {
    keys.push(
      util.dynamodb.toMapValues({
        PK: `${DDBPrefixGameDefaults}#${FallbackLanguage}`,
        SK: `${DDBPrefixGameDefaults}#${gameType}`,
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

export function response(
  context: Context<{ input: JoinGameInput | CreateGameInput }>,
): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // Get gameType from previous result (joinGame) or from input (createGame)
  const gameType =
    context.prev?.result?.gameType ||
    (context.arguments.input as CreateGameInput).gameType;
  const language = context.arguments.input.language;

  const tableName = "Wildsea-" + environment.name;

  const results = context.result.data[tableName] || [];

  // Try to find the result for the requested language first
  let gameDefaults = results.find(
    (item: DynamoDBGameDefaults) =>
      item && item.PK === `${DDBPrefixGameDefaults}#${language}`,
  ) as DynamoDBGameDefaults | undefined;

  // If not found and language is not English, try English fallback
  if (!gameDefaults && language !== FallbackLanguage) {
    gameDefaults = results.find(
      (item: DynamoDBGameDefaults) =>
        item && item.PK === `${DDBPrefixGameDefaults}#${FallbackLanguage}`,
    ) as DynamoDBGameDefaults | undefined;
  }

  // If we don't have a result from database, error out
  if (!gameDefaults) {
    util.error(`Invalid game type: ${gameType}`, "InvalidGameType");
  }

  const defaultNPCs = gameDefaults.defaultNPCs.map((npcItem) => ({
    type: npcItem.type,
    characterName: npcItem.characterName,
  }));

  const defaults: GameDefaults = {
    defaultCharacterName: gameDefaults.defaultCharacterName,
    defaultGMName: gameDefaults.defaultGMName,
    defaultNPCs: defaultNPCs,
    theme: gameDefaults.theme,
  };

  // Store the defaults in stash for the next function to use
  context.stash.gameDefaults = defaults;

  // Pass through the previous result (game data from getGameWithToken) or empty object for createGame
  return context.prev?.result || {};
}
