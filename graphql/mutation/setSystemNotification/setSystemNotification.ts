import { util, Context } from "@aws-appsync/utils";
import type { DynamoDBPutItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type {
  SystemNotification,
  SetSystemNotificationInput,
} from "../../../appsync/graphql";
import { DDBPrefixNotification } from "../../lib/constants/dbPrefixes";
import { TypeNotification } from "../../lib/constants/entityTypes";

export function request(
  context: Context<{ input: SetSystemNotificationInput }>,
): DynamoDBPutItemRequest {
  const { message, urgent = false } = context.arguments.input;

  const now = util.time.nowISO8601();

  const item: SystemNotification = {
    message: message,
    urgent: urgent,
    type: TypeNotification,
    createdAt: now,
    updatedAt: now,
  };

  return {
    operation: "PutItem",
    key: {
      PK: util.dynamodb.toString(`${DDBPrefixNotification}#SYSTEM`),
      SK: util.dynamodb.toString(`${DDBPrefixNotification}#`),
    },
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(
  context: Context<{ input: SetSystemNotificationInput }>,
): SystemNotification {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.result as SystemNotification;
}
