import {
  Context,
  util,
  extensions,
  DynamoDBGetItemRequest,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import { DDBPrefixGame } from "./constants/dbPrefixes";
import { DataGame, SubscriptionGenericArgs } from "./dataTypes";

export type ContextType = Context<
  SubscriptionGenericArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  DataGame
>;

export function subscriptionRequest(
  context: ContextType,
): DynamoDBGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();
  if (context.args.gameId == "") util.unauthorized();

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + context.args.gameId,
      SK: DDBPrefixGame,
    }),
  };
}

export function subscriptionResponse(
  context: ContextType,
  objectTypes: string[],
) {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  // if the user is not a player or GM in this game, or the game does not exist, refuse
  if (
    !context.result ||
    (context.result.gmUserId !== identity.sub &&
      !context.result.players?.includes(identity.sub))
  ) {
    util.unauthorized();
  }

  const filter = {
    gameId: { eq: context.args.gameId },
    type: { in: objectTypes },
  };
  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter));

  return null;
}
