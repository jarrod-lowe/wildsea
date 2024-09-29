import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { Game, JoinGameInput } from "../../../appsync/graphql";
import { DDBPrefixGame } from "../../lib/constants";

export function request(
  context: Context<{ input: JoinGameInput }>,
): DynamoDBGetItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const id = context.arguments.input.gameId;
  const key = {
    PK: DDBPrefixGame + "#" + id,
    SK: DDBPrefixGame,
  };

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues(key),
  };
}

export function response(
  context: Context<{ input: JoinGameInput }>,
): Game | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  if (
    context.result === null ||
    context.result.joinToken !== context.arguments.input.joinToken
  ) {
    util.error(
      "Game not found or invalid token" as string,
      "AccessDeniedException",
    );
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (identity.sub === context.result.fireflyUserId) {
    util.error("You cannot join your own game" as string, "Conflict");
  }

  if (context.result.players?.includes(identity.sub)) {
    util.error("You are already a player in this game" as string, "Conflict");
  }

  return context.result;
}
