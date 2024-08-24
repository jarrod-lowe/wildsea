import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";

export function request(
  context: Context<{ id: string }>,
): DynamoDBGetItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const id = context.arguments.id;
  const key = {
    PK: "GAME#" + id,
    SK: "GAME",
  };

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues(key),
  };
}

export function response(context: Context) {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return;
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.appendError("Unauthorized: User ID is missing." as string);
    return;
  }

  if (!permitted(identity, context.result)) {
    util.appendError(
      "Unauthorized: User does not have access to the game." as string,
    );
    return;
  }

  if (!context.result) {
    util.appendError("Game not found." as string);
    return;
  }

  return context.result;
}

interface Data {
  fireflyUserId: string;
  players: string[];
}
function permitted(identity: AppSyncIdentityCognito, data: Data): boolean {
  if (data === null) {
    return false;
  }

  if (data.fireflyUserId === identity.sub) {
    return true;
  }

  for (const player of data.players) {
    if (player === identity.sub) {
      return true;
    }
  }

  return false;
}
