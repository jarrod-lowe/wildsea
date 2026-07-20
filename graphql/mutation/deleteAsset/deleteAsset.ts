import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBTransactWriteItemsRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { DeleteAssetInput } from "../../../appsync/graphql";
import { TypeAsset } from "../../lib/constants/entityTypes";
import {
  DDBPrefixGame,
  DDBPrefixAsset,
  DDBPrefixSection,
} from "../../lib/constants/dbPrefixes";
import {
  ASSET_STATUS_PENDING,
  ASSET_STATUS_READY,
  ASSET_STATUS_EXPIRED,
  ASSET_STATUS_DELETED,
} from "../../lib/constants/assetStatus";

export function request(
  context: Context<{ input: DeleteAssetInput }>,
): DynamoDBTransactWriteItemsRequest {
  // Authorization check
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();

  // Delete asset record with condition on status and sectionId
  const assetItem = {
    operation: "DeleteItem" as const,
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixAsset + "#" + input.assetId,
    }),
    condition: {
      expression:
        "#status IN (:pending, :ready, :expired) AND #type = :type AND #sectionId = :sectionId",
      expressionNames: {
        "#status": "status",
        "#type": "type",
        "#sectionId": "sectionId",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pending": ASSET_STATUS_PENDING,
        ":ready": ASSET_STATUS_READY,
        ":expired": ASSET_STATUS_EXPIRED,
        ":type": TypeAsset,
        ":sectionId": input.sectionId,
      }),
      returnValuesOnConditionCheckFailure: false,
    },
  };

  // Update game to increment remainingAssets
  const gameItem = {
    operation: "UpdateItem" as const,
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixGame,
    }),
    update: {
      expression:
        "SET #updatedAt = :updatedAt, #remainingAssets = #remainingAssets + :one",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#remainingAssets": "remainingAssets",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":updatedAt": timestamp,
        ":one": 1,
      }),
    },
  };

  // Update section to remove asset ID from assets list using DELETE
  const sectionItem = {
    operation: "UpdateItem" as const,
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
    update: {
      expression: "SET #updatedAt = :updatedAt DELETE #assets :assetId",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#assets": "assets",
      },
      expressionValues: {
        ":updatedAt": { S: timestamp },
        ":assetId": { SS: [input.assetId] },
      },
    },
    condition: {
      expression: "#userId = :userId",
      expressionNames: {
        "#userId": "userId",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": identity.sub,
      }),
      returnValuesOnConditionCheckFailure: false,
    },
  };

  // Store data for response
  context.stash.deletedAsset = {
    gameId: input.gameId,
    sectionId: input.sectionId,
    assetId: input.assetId,
    status: ASSET_STATUS_DELETED,
    createdAt: null,
    updatedAt: timestamp,
    type: TypeAsset,
  };

  return {
    operation: "TransactWriteItems",
    transactItems: [assetItem, gameItem, sectionItem],
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // Return Asset with DELETED status and minimal data
  return context.stash.deletedAsset;
}
