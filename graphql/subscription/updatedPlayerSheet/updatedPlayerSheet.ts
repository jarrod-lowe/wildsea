import {
  Context,
  util,
  extensions,
  DynamoDBGetItemRequest,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import { SubscriptionUpdatedPlayerSheetArgs } from "../../../appsync/graphql";
import { DDBPrefixGame } from "../../lib/constants";
import { DataGame } from "../../lib/dataTypes";

type UpdatedPlayerSheetType = Context<
  SubscriptionUpdatedPlayerSheetArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  DataGame
>;

export function request(
  context: UpdatedPlayerSheetType,
): DynamoDBGetItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + context.args.gameId,
      SK: DDBPrefixGame,
    }),
  };
}

export function response(context: UpdatedPlayerSheetType) {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  // if the user is not a player or GM in this game, refuse
  if (
    context.result.fireflyUserId !== identity.sub &&
    !context.result.players?.includes(identity.sub)
  ) {
    util.error("Unauthorized: User is not a player in this game." as string);
  }

  const filter = {
    gameId: { eq: context.args.gameId },
  };
  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter));

  return null;
}
