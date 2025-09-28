import { util, Context } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { ExpireAssetInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixAsset } from "../../lib/constants/dbPrefixes";
import {
  ASSET_STATUS_PENDING,
  ASSET_STATUS_EXPIRED,
} from "../../lib/constants/assetStatus";

export function request(
  context: Context<{ input: ExpireAssetInput }>,
): DynamoDBUpdateItemRequest {
  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixAsset + "#" + input.assetId,
    }),
    update: {
      expression: "SET #status = :expired, #updatedAt = :updatedAt",
      expressionNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":expired": ASSET_STATUS_EXPIRED,
        ":updatedAt": timestamp,
      }),
    },
    condition: {
      expression: "#status = :pending",
      expressionNames: {
        "#status": "status",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pending": ASSET_STATUS_PENDING,
      }),
    },
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.result;
}
