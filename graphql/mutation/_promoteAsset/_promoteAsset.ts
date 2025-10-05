import { util, Context } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { PromoteAssetInput } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixAsset } from "../../lib/constants/dbPrefixes";
import {
  ASSET_STATUS_FINALISING,
  ASSET_STATUS_READY,
} from "../../lib/constants/assetStatus";

export function request(
  context: Context<{ input: PromoteAssetInput }>,
): DynamoDBUpdateItemRequest {
  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();

  const { gameId, assetId } = input;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixAsset + "#" + assetId,
    }),
    update: {
      expression: "SET #status = :ready, #updatedAt = :updatedAt",
      expressionNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":ready": ASSET_STATUS_READY,
        ":updatedAt": timestamp,
      }),
    },
    condition: {
      expression: "#status = :finalising",
      expressionNames: {
        "#status": "status",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":finalising": ASSET_STATUS_FINALISING,
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
