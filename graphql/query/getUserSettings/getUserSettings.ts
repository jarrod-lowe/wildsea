import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { UserSettings } from "../../../appsync/graphql";
import { DDBPrefixSettings } from "../../lib/constants/dbPrefixes";

export function request(context: Context): DynamoDBGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  return {
    operation: "GetItem",
    key: {
      PK: util.dynamodb.toString(`${DDBPrefixSettings}#${identity.sub}`),
      SK: util.dynamodb.toString(`${DDBPrefixSettings}#`),
    },
  };
}

export function response(context: Context): UserSettings | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.result as UserSettings | null;
}
