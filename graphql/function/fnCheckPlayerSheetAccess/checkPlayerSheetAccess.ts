import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataPlayerSheet } from "../../lib/dataTypes";
import type { MutationCreateSectionArgs } from "../../../appsync/graphql";

export function request(
  context: Context<MutationCreateSectionArgs>,
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
    PK: "GAME#" + id,
    SK: "PLAYER#" + identity.sub,
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
    util.appendError(context.error.message, context.error.type, context.result);
    return;
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.appendError("Unauthorized: User ID is missing." as string);
    return;
  }

  if (identity.sub != context.result.userId) {
    util.appendError(
      "Unauthorized: User does not have access to the player sheet." as string,
    );
    return;
  }

  return context.result;
}
