import {
  util,
  Context,
  AppSyncIdentityCognito,
  DynamoDBQueryRequest,
} from "@aws-appsync/utils";
import type { DeletePlayerInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixSectionUser } from "../../lib/constants";

export function request(
  context: Context<{ input: DeletePlayerInput }>,
): DynamoDBQueryRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing.");
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing.");
  }

  const input = context.arguments.input;
  const { gameId, userId } = input;

  // Query for all sections belonging to the player in this game
  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "#GSI1PK = :gsi1pk AND #PK = :pk",
      expressionNames: {
        "#GSI1PK": "GSI1PK",
        "#PK": "PK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":gsi1pk": DDBPrefixSectionUser + "#" + userId,
        ":pk": DDBPrefixGame + "#" + gameId,
      }),
    },
    projection: {
      expression: "#sectionId",
      expressionNames: { "#sectionId": "sectionId" },
    },
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  return context.result;
}
