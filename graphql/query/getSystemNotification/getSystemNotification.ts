import { util, Context } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { SystemNotification } from "../../../appsync/graphql";
import { DDBPrefixNotification } from "../../lib/constants/dbPrefixes";

export function request(): DynamoDBGetItemRequest {
  return {
    operation: "GetItem",
    key: {
      PK: util.dynamodb.toString(`${DDBPrefixNotification}#SYSTEM`),
      SK: util.dynamodb.toString(`${DDBPrefixNotification}#`),
    },
  };
}

export function response(context: Context): SystemNotification | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  if (!context.result) {
    return null;
  }

  return context.result as SystemNotification;
}
