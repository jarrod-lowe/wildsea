import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { SheetSection, UpdateSectionInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixSection } from "../../lib/constants";

export function request(
  context: Context<{ input: UpdateSectionInput }>,
): DynamoDBUpdateItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();
  const sk = DDBPrefixSection + "#" + input.sectionId;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: sk,
    }),
    condition: {
      expression: "#SK = :SK AND #userId = :userId",
      expressionNames: {
        "#SK": "SK",
        "#userId": "userId",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":SK": sk,
        ":userId": identity.sub,
      }),
    },
    update: {
      expression:
        "SET #sectionName = :sectionName, #content = :content, #updatedAt = :updatedAt",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#content": "content",
        "#sectionName": "sectionName",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":updatedAt": timestamp,
        ":content": input.content,
        ":sectionName": input.sectionName,
      }),
    },
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return null;
  }
  return context.result;
}
