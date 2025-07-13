import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { PlayerSheet, UpdatePlayerInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeShip } from "../../lib/constants/entityTypes";

export function request(
  context: Context<{ input: UpdatePlayerInput }>,
): DynamoDBUpdateItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();
  const sk = DDBPrefixPlayer + "#" + input.userId;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: sk,
    }),
    condition: {
      expression: "#userId = :userId OR #type = :type",
      expressionNames: {
        "#userId": "userId",
        "#type": "type",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": identity.sub,
        ":type": TypeShip,
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
    if (context.error.type === "DynamoDB:ConditionalCheckFailedException")
      util.unauthorized();
    util.error(context.error.message, context.error.type, context.result);
  }
  return context.result;
}
