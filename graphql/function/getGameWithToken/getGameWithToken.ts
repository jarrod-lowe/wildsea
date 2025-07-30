import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBQueryRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { Game, JoinGameInput } from "../../../appsync/graphql";
import { DDBPrefixJoin } from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: JoinGameInput }>,
): DynamoDBQueryRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const { joinCode } = context.arguments.input;

  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "GSI1PK = :gsi1pk",
      expressionValues: util.dynamodb.toMapValues({
        ":gsi1pk": `${DDBPrefixJoin}#${joinCode}`,
      }),
    },
  };
}

interface QueryResult {
  items: Game[];
}

export function response(context: Context<{ input: JoinGameInput }>): Game {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const result = context.result as QueryResult;
  if (!result?.items?.length) {
    util.unauthorized();
  }

  const game: Game = result.items[0];
  const identity = context.identity as AppSyncIdentityCognito;

  if (identity.sub === game.fireflyUserId) {
    util.error("You cannot join your own game", "Conflict");
  }

  if (game.playerSheets?.some((sheet) => sheet.userId === identity.sub)) {
    util.error("You are already a player in this game", "Conflict");
  }

  return game;
}
