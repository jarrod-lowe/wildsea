import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { Game } from "../../../appsync/graphql";

/**
 * A CreateGameInput creates a Game.
 * They are stored in DynamoDB with a PK of `GAME#<id>` and an SK of `GAME`.
 * The ID is a UUID
 * The fireflyUserId is the Cognito ID of the user
 */

interface CreateGameInput {
  name: string;
  description?: string;
}

export function request(context: Context<{ input: CreateGameInput }>): unknown {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const id = util.autoId();
  const timestamp = util.time.nowISO8601();

  context.stash.record = {
    gameName: input.name,
    gameDescription: input.description,
    gameId: id,
    fireflyUserId: identity.sub,
    // players: no value yet
    createdAt: timestamp,
    updatedAt: timestamp,
    type: "GAME",
  };

  const gameItem = {
    key: util.dynamodb.toMapValues({ PK: "GAME#" + id, SK: "GAME" }),
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    attributeValues: util.dynamodb.toMapValues(
      context.stash.record,
    ) as PutItemInputAttributeMap,
  };

  const fireflyItem = {
    key: util.dynamodb.toMapValues({
      PK: "GAME#" + id,
      SK: "PLAYER#GM#" + identity.sub,
    }),
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    attributeValues: util.dynamodb.toMapValues({
      userId: identity.sub,
      gameId: id,
      gameName: input.name,
      gameDescription: input.description,
      GSI1PK: "USER#" + identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: "CHARACTER",
    }) as PutItemInputAttributeMap,
  };

  return {
    operation: "TransactWriteItems",
    transactItems: [gameItem, fireflyItem],
  };
}

export function response(context: Context): Game | null {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return null;
  }
  return {
    PK: context.result.keys[0].PK,
    SK: context.result.keys[0].SK,
    gameName: context.stash.record.gameName,
    gameDescription: context.stash.record.gameDescription,
    gameId: context.stash.record.gameId,
    fireflyUserId: context.stash.record.fireflyUserId,
    createdAt: context.stash.record.createdAt,
    updatedAt: context.stash.record.updatedAt,
    type: context.stash.record.type,
  } as Game;
}
