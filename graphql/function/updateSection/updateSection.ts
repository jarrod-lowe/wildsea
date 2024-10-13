import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { SheetSection, UpdateSectionInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixSection, TypeShip } from "../../lib/constants";

interface UpdateType {
  updatedAt: string;
  sectionName?: string;
  content?: string;
  position?: number;
}

export function request(
  context: Context<{ input: UpdateSectionInput }>,
): DynamoDBUpdateItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();
  const sk = DDBPrefixSection + "#" + input.sectionId;

  const updates: UpdateType = {
    updatedAt: timestamp,
  };
  if (input.sectionName !== undefined) {
    updates.sectionName = input.sectionName as string;
  }
  if (input.content !== undefined) {
    updates.content = input.content as string;
  }
  if (input.position !== undefined) {
    updates.position = input.position as number;
  }

  const setExpressions: string[] = [];
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: string | number } = {};

  Object.entries(updates).forEach(([key, value]) => {
    const placeholderKey = `#${key}`;
    const placeholderValue = `:${key}`;

    setExpressions.push(`${placeholderKey} = ${placeholderValue}`);
    expressionAttributeNames[placeholderKey] = key;
    expressionAttributeValues[placeholderValue] = value;
  });
  const setExpressionString = `SET ${setExpressions.join(", ")}`;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: sk,
    }),
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
    update: {
      expression: setExpressionString,
      expressionNames: expressionAttributeNames,
      expressionValues: util.dynamodb.toMapValues(expressionAttributeValues),
    },
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    if (context.error.type === "DynamoDB:ConditionalCheckFailedException")
      util.unauthorized();
    util.error(context.error.message, context.error.type, context.result);
  }
  return context.result;
}
