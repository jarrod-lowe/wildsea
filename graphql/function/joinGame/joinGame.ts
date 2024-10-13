import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import type { GameSummary, JoinGameInput } from "../../../appsync/graphql";
import {
  TypeCharacter,
  DefaultPlayerCharacterName,
  DDBPrefixGame,
  DDBPrefixPlayer,
} from "../../lib/constants";
import { DataPlayerSheet } from "../../lib/dataTypes";

export function request(context: Context<{ input: JoinGameInput }>): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const id = context.arguments.input.gameId;
  const timestamp = util.time.nowISO8601();

  const gameItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + id,
      SK: DDBPrefixGame,
    }),
    update: {
      expression: "ADD #players :player SET #updatedAt = :updatedAt",
      expressionNames: {
        "#players": "players",
        "#updatedAt": "updatedAt",
      },
      expressionValues: {
        ":player": { SS: [identity.sub] },
        ":updatedAt": { S: timestamp },
      },
    },
  } as PutItemInputAttributeMap;

  const playerItem = {
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + id,
      SK: DDBPrefixPlayer + "#" + identity.sub,
    }),
    attributeValues: util.dynamodb.toMapValues({
      gameId: id,
      userId: identity.sub,
      GSI1PK: "USER#" + identity.sub,
      gameName: context.prev.result.gameName,
      gameDescription: context.prev.result.gameDescription,
      characterName: DefaultPlayerCharacterName,
      fireflyUserId: context.prev.result.fireflyUserId,
      type: TypeCharacter,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as DataPlayerSheet),
  } as PutItemInputAttributeMap;

  return {
    operation: "TransactWriteItems",
    transactItems: [gameItem, playerItem],
  };
}

export function response(
  context: Context<{ input: JoinGameInput }>,
): GameSummary | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  delete context.prev.result.joinToken;
  delete context.prev.result.playerSheets;
  delete context.prev.result.players;
  return context.prev.result;
}
