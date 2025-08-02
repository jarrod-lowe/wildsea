import {
  util,
  runtime,
  Context,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataPlayerSheet } from "../../lib/dataTypes";
import type { MutationCreateSectionArgs } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeNPC } from "../../lib/constants/entityTypes";

/* If the request is for a different userId than the subject, check that it is an
 * NPC sheet in the current game */

export function request(
  context: Context<MutationCreateSectionArgs>,
): DynamoDBGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const gameId = context.arguments.input.gameId;
  const userId = context.arguments.input.userId;

  if (userId == identity.sub) {
    // No need to do a check
    runtime.earlyReturn(context.prev.result);
  }

  const key = {
    PK: DDBPrefixGame + "#" + gameId,
    SK: DDBPrefixPlayer + "#" + userId,
  };

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues(key),
  };
}

type ResponseContext = Context<
  MutationCreateSectionArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  DataPlayerSheet
>;

export function response(
  context: ResponseContext,
): DataPlayerSheet | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  if (!context.result) util.unauthorized();
  if (context.result.type !== TypeNPC) util.unauthorized();

  context.stash.playerType = context.result.type;

  return context.result;
}
