import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { GameSummary, CreateGameInput } from "../../../appsync/graphql";
import {
  TypeFirefly,
  DefaultFireflyCharacterName,
  TypeGame,
  DDBPrefixGame,
  DDBPrefixPlayer,
  TypeShip,
  DefaultShipCharacterName,
} from "../../lib/constants";
import { DataPlayerSheet } from "../../lib/dataTypes";

export function request(context: Context<{ input: CreateGameInput }>): unknown {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const id = util.autoId();
  const joinToken = util.autoId();
  const timestamp = util.time.nowISO8601();

  context.stash.record = {
    gameName: input.name,
    gameDescription: input.description,
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
      gameDescription: input.description,
      characterName: DefaultFireflyCharacterName,
      GSI1PK: "USER#" + identity.sub,
      fireflyUserId: identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeFirefly,
    } as DataPlayerSheet) as PutItemInputAttributeMap,
  };

  const shipId = util.autoId();
  const shipItem = {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + id,
      SK: DDBPrefixPlayer + "#" + shipId,
    }),
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    attributeValues: util.dynamodb.toMapValues({
      userId: shipId,
      gameId: id,
      gameName: input.name,
      gameDescription: input.description,
      characterName: DefaultShipCharacterName,
      fireflyUserId: identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeShip,
    } as DataPlayerSheet) as PutItemInputAttributeMap,
  };

  return {
    operation: "TransactWriteItems",
    transactItems: [gameItem, fireflyItem, shipItem],
  };
}

export function response(context: Context): GameSummary | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return {
    gameName: context.stash.record.gameName,
    gameDescription: context.stash.record.gameDescription,
    gameId: context.stash.record.gameId,
    fireflyUserId: context.stash.record.fireflyUserId,
    createdAt: context.stash.record.createdAt,
    updatedAt: context.stash.record.updatedAt,
    type: context.stash.record.type,
  };
}
