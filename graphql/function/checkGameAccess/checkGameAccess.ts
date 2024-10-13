import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataGame } from "../../lib/dataTypes";
import type { GetGameInput, QueryGetGameArgs } from "../../../appsync/graphql";
import { DDBPrefixGame } from "../../lib/constants";

export function request(
  context: Context<{ input: GetGameInput }>,
): DynamoDBGetItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const id = context.args.input.gameId;
  const key = {
    PK: DDBPrefixGame + "#" + id,
    SK: DDBPrefixGame,
  };

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues(key),
  };
}

type ResponseContext = Context<
  QueryGetGameArgs,
  Record<string, unknown>,
  undefined,
  undefined,
  DataGame
>;

export function response(context: ResponseContext): DataGame | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();
  if (!permitted(identity, context.result)) util.unauthorized();

  context.stash.isFirefly = context.result.fireflyUserId === identity.sub;

  return context.result;
}

export function permitted(
  identity: AppSyncIdentityCognito,
  data: DataGame,
): boolean {
  if (data === null) {
    return false;
  }

  if (data.fireflyUserId === identity.sub) {
    return true;
  }

  if (data.players) {
    for (const player of data.players) {
      if (player === identity.sub) {
        return true;
      }
    }
  }

  return false;
}
