import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBDeleteItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { GameSummary, DeleteGameInput } from "../../../appsync/graphql";
import { TypeGame, DDBPrefixGame } from "../../lib/constants";

export function request(
  context: Context<{ input: DeleteGameInput }>,
): DynamoDBDeleteItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

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
      util.error(
        "Unauthorized: Only the firefly can delete the game",
        "NotAuthorized",
      );
    } else {
      util.error(context.error.message, context.error.type, context.result);
    }
  }

  if (!context.result) {
    util.error("Game not found", "NotFound");
  }

  // Return the game details with deleted flag
  return {
    gameId: context.result.gameId,
    gameName: context.result.gameName,
    gameDescription: context.result.gameDescription,
    fireflyUserId: context.result.fireflyUserId,
    createdAt: context.result.createdAt,
    updatedAt: util.time.nowISO8601(),
    type: TypeGame,
    deleted: true,
  };
}
