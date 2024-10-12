import {
  util,
  Context,
  AppSyncIdentityCognito,
  DynamoDBQueryRequest,
} from "@aws-appsync/utils";
import type { DeletePlayerInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants";

export function request(
  context: Context<{ input: DeletePlayerInput }>,
): DynamoDBQueryRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing.");
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing.");
  }

  const input = context.arguments.input;

  // Query for all players in this game
  return {
    operation: "Query",
    query: {
      expression: "#PK = :pk AND begins_with(#SK, :player)",
      expressionNames: {
        "#PK": "PK",
        "#SK": "SK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pk": DDBPrefixGame + "#" + input.gameId,
        ":player": DDBPrefixPlayer + "#",
      }),
    },
    projection: {
      expression: "#userId",
      expressionNames: { "#userId": "userId" },
    },
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  return context.result;
}
