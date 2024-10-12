import {
  Context,
  util,
  extensions,
  DynamoDBGetItemRequest,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import { DDBPrefixGame } from "./constants";
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
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  if (context.args.gameId == "") {
    util.error("Unauthorized: Game ID is missing." as string);
  }

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
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  // if the user is not a player or GM in this game, or the game does not exist, refuse
  if (
    !context.result ||
    (context.result.fireflyUserId !== identity.sub &&
      !context.result.players?.includes(identity.sub))
  ) {
    util.error("Unauthorized: User is not a player in this game." as string);
  }

  const filter = {
    gameId: { eq: context.args.gameId },
    type: { in: objectTypes },
  };
  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter));

  return null;
}
