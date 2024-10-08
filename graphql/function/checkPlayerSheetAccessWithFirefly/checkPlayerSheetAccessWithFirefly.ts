import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataPlayerSheet } from "../../lib/dataTypes";
import type {
  DeletePlayerInput,
  MutationCreateSectionArgs,
} from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants";

export function request(
  context: Context<{ input: DeletePlayerInput }>,
): DynamoDBGetItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const gameId = context.arguments.input.gameId;
  const userId = context.arguments.input.userId;
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

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  if (
    !context.result ||
    (identity.sub != context.result.userId &&
      identity.sub != context.result.fireflyUserId)
  ) {
    util.error(
      "Unauthorized: User does not have access to the player sheet." as string,
    );
  }

  console.log(context.result);
  context.stash.userId = context.result.userId;
  context.stash.gameId = context.result.gameId;
  context.stash.fireflyUserId = context.result.fireflyUserId;
  context.stash.gameName = context.result.gameName;
  context.stash.gameDescription = context.result.gameDescription;
  context.stash.characterName = context.result.characterName;
  context.stash.createdAt = context.result.createdAt;

  return context.result;
}
