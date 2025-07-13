import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBDeleteItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { SheetSection, DeleteSectionInput } from "../../../appsync/graphql";
import {
  DDBPrefixGame,
  DDBPrefixSection,
} from "../../lib/constants/dbPrefixes";
import { TypeShip } from "../../lib/constants/entityTypes";

export function request(
  context: Context<{ input: DeleteSectionInput }>,
): DynamoDBDeleteItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;

  return {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
    operation: "DeleteItem",
    condition: {
      expression: "#userId = :userId OR #playerType = :playerType",
      expressionNames: {
        "#userId": "userId",
        "#playerType": "playerType",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": identity.sub,
        ":playerType": TypeShip,
      }),
    },
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    if (context.error.type === "DynamoDB:ConditionalCheckFailedException")
      util.unauthorized();
    util.error(context.error.message, context.error.type, context.result);
  }

  // If the deletion was successful, return a SheetSection object with the deleted flag set to true
  return { ...context.result, deleted: true };
}
