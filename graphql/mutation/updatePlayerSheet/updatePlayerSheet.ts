import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { PlayerSheet, UpdatePlayerSheetInput } from "../../../appsync/graphql";
import { DDBPrefixPlayer } from "../../lib/constants";

export function request(
  context: Context<{ input: UpdatePlayerSheetInput }>,
): DynamoDBUpdateItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  if (context.arguments.input.userId != identity.sub) {
    util.error("Unauthorized: User ID does not match." as string);
  }

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();
  const sk = DDBPrefixPlayer + "#" + identity.sub;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: "GAME#" + input.gameId,
      SK: sk,
    }),
    condition: {
      expression: "#SK = :SK",
      expressionNames: {
        "#SK": "SK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":SK": sk,
      }),
    },
    update: {
      expression:
        "SET #characterName = :characterName, #updatedAt = :updatedAt",
      expressionNames: {
        "#characterName": "characterName",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":updatedAt": timestamp,
        ":characterName": input.characterName,
      }),
    },
  };
}

export function response(context: Context): PlayerSheet | null {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return null;
  }
  return context.result;
}
