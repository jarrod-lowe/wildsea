import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBQueryRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { PlayerSheetSummary } from "../../../appsync/graphql";

export function request(context: Context): DynamoDBQueryRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "#gsi1pk = :gsi1pk",
      expressionNames: {
        "#gsi1pk": "GSI1PK",
      },
      expressionValues: {
        ":gsi1pk": util.dynamodb.toString("USER#" + identity.sub),
      },
    },
  };
}

export function response(context: Context): PlayerSheetSummary[] {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }
  return context.result.items as PlayerSheetSummary[];
}
