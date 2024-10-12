import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBDeleteItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { SheetSection, DeleteSectionInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixSection } from "../../lib/constants";

export function request(
  context: Context<{ input: DeleteSectionInput }>,
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
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
    operation: "DeleteItem",
    condition: {
      expression: "#userId = :userId",
      expressionNames: {
        "#userId": "userId",
      },
      expressionValues: {
        ":userId": { S: identity.sub },
      },
    },
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // If the deletion was successful, return a SheetSection object with the deleted flag set to true
  return { ...context.result, deleted: true };
}
