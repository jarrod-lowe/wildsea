import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBDeleteItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { GameSummary, DeleteGameInput } from "../../../appsync/graphql";
import { TypeGame } from "../../lib/constants/entityTypes";
import { DDBPrefixGame } from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: DeleteGameInput }>,
): DynamoDBDeleteItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;

  return {
    operation: "DeleteItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixGame,
    }),
    condition: {
      expression: "#fireflyUserId = :userId",
      expressionNames: {
        "#fireflyUserId": "fireflyUserId",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": identity.sub,
      }),
    },
  };
}

export function response(context: Context): GameSummary {
  if (context.error) {
    if (context.error.type === "ConditionalCheckFailedException") {
      util.unauthorized();
    } else {
      util.error(context.error.message, context.error.type, context.result);
    }
  }

  if (!context.result) {
    util.unauthorized();
  }

  // Return the game details with deleted flag
  return {
    gameId: context.result.gameId,
    gameName: context.result.gameName,
    gameType: context.result.gameType,
    gameDescription: context.result.gameDescription,
    fireflyUserId: context.result.fireflyUserId,
    createdAt: context.result.createdAt,
    updatedAt: util.time.nowISO8601(),
    type: TypeGame,
    deleted: true,
    theme: context.result.theme || "default",
    remainingCharacters: 0, // Game is deleted, no remaining characters
    remainingSections: 0, // Game is deleted, no remaining sections
  };
}
