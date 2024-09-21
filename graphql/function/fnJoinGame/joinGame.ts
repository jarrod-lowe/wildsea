import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import type { Game, JoinGameInput } from "../../../appsync/graphql";
import { TypeCharacter, DefaultPlayerCharacterName } from "../../lib/constants";

export function request(context: Context<{ input: JoinGameInput }>): unknown {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const id = context.arguments.input.gameId;
  const timestamp = util.time.nowISO8601();

  const gameItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: "GAME#" + id,
      SK: "GAME",
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
      PK: "GAME#" + id,
      SK: "PLAYER#" + identity.sub,
    }),
    attributeValues: util.dynamodb.toMapValues({
      gameId: id,
      userId: identity.sub,
      GSI1PK: "USER#" + identity.sub,
      gameName: context.prev.result.gameName,
      gameDescription: context.prev.result.gameDescription,
      characterName: DefaultPlayerCharacterName,
      type: TypeCharacter,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  } as PutItemInputAttributeMap;

  return {
    operation: "TransactWriteItems",
    transactItems: [gameItem, playerItem],
  };
}

export function response(
  context: Context<{ input: JoinGameInput }>,
): Game | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  context.prev.result.joinToken = null;
  context.prev.result.playerSheets = [];
  return context.prev.result;
}
