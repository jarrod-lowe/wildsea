import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { GameSummary, CreateGameInput } from "../../../appsync/graphql";
import { TypeFirefly, TypeGame } from "../../lib/constants/entityTypes";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import {
  GameTypeConfig,
  DefaultGameConfig,
} from "../../lib/constants/gameTypes";
import { DataPlayerSheet } from "../../lib/dataTypes";

export function request(context: Context<{ input: CreateGameInput }>): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;
  const id = util.autoId();
  const joinToken = util.autoId();
  const timestamp = util.time.nowISO8601();

  const config = GameTypeConfig[input.gameType] || DefaultGameConfig;

  context.stash.record = {
    gameName: input.name,
    gameDescription: input.description,
    gameType: input.gameType,
    gameId: id,
    fireflyUserId: identity.sub,
    // players: no value yet
    joinToken: joinToken,
    createdAt: timestamp,
    updatedAt: timestamp,
    type: TypeGame,
  };

  const gameItem = {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + id,
      SK: DDBPrefixGame,
    }),
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    attributeValues: util.dynamodb.toMapValues(
      context.stash.record,
    ) as PutItemInputAttributeMap,
  };

  const fireflyItem = {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + id,
      SK: DDBPrefixPlayer + "#" + identity.sub,
    }),
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    attributeValues: util.dynamodb.toMapValues({
      userId: identity.sub,
      gameId: id,
      gameName: input.name,
      gameType: input.gameType,
      gameDescription: input.description,
      characterName: config.fireflyCharacterName,
      GSI1PK: "USER#" + identity.sub,
      fireflyUserId: identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeFirefly,
    } as DataPlayerSheet) as PutItemInputAttributeMap,
  };

  const transactItems = [gameItem, fireflyItem];

  // Create all configured default NPCs for this game type
  config.defaultNPCs.forEach((npcConfig) => {
    const npcId = util.autoId();
    const npcItem = {
      key: util.dynamodb.toMapValues({
        PK: DDBPrefixGame + "#" + id,
        SK: DDBPrefixPlayer + "#" + npcId,
      }),
      operation: "PutItem",
      table: "Wildsea-" + environment.name,
      attributeValues: util.dynamodb.toMapValues({
        userId: npcId,
        gameId: id,
        gameName: input.name,
        gameDescription: input.description,
        gameType: input.gameType,
        characterName: npcConfig.characterName,
        fireflyUserId: identity.sub,
        createdAt: timestamp,
        updatedAt: timestamp,
        type: npcConfig.type,
      } as DataPlayerSheet) as PutItemInputAttributeMap,
    };

    transactItems.push(npcItem);
  });

  return {
    operation: "TransactWriteItems",
    transactItems,
  };
}

export function response(context: Context): GameSummary | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return {
    gameName: context.stash.record.gameName,
    gameDescription: context.stash.record.gameDescription,
    gameType: context.stash.record.gameType,
    gameId: context.stash.record.gameId,
    fireflyUserId: context.stash.record.fireflyUserId,
    createdAt: context.stash.record.createdAt,
    updatedAt: context.stash.record.updatedAt,
    type: context.stash.record.type,
  };
}
