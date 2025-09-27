import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { RequestAssetUploadInput } from "../../../appsync/graphql";
import type { DataAsset } from "../../lib/dataTypes";
import { TypeAsset } from "../../lib/constants/entityTypes";
import {
  DDBPrefixGame,
  DDBPrefixAsset,
  DDBPrefixSection,
} from "../../lib/constants/dbPrefixes";
import {
  MAX_ASSET_SIZE_BYTES,
  ASSET_CLEANUP_TIMEOUT_SECONDS,
  ASSET_STATUS_PENDING,
  ALLOWED_ASSET_MIME_TYPES,
} from "../../lib/constants/assets";

export function request(
  context: Context<{ input: RequestAssetUploadInput }>,
): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;
  const assetId = util.autoId();
  const timestamp = util.time.nowISO8601();

  // Set cleanup time from now
  const cleanupAtSeconds =
    util.time.nowEpochSeconds() + ASSET_CLEANUP_TIMEOUT_SECONDS;
  const cleanupAt = `${cleanupAtSeconds}`;

  // Validate mime type
  if (!ALLOWED_ASSET_MIME_TYPES.includes(input.mimeType)) {
    util.error(
      "Invalid mime type. Only images are allowed.",
      "InvalidMimeType",
    );
  }

  // Validate file size
  if (input.sizeBytes > MAX_ASSET_SIZE_BYTES) {
    util.error(
      `File size too large. Maximum ${MAX_ASSET_SIZE_BYTES / (1024 * 1024)}MB allowed.`,
      "FileTooLarge",
    );
  }

  const bucket = `wildsea-${environment.name}-assets`;
  const originalKey = `asset/game/${input.gameId}/section/${input.sectionId}/${assetId}/original`;
  const variantsPrefix = `asset/game/${input.gameId}/section/${input.sectionId}/${assetId}/variants/`;

  // Create asset record
  const assetData: DataAsset = {
    gameId: input.gameId,
    sectionId: input.sectionId,
    assetId: assetId,
    label: input.label || undefined,
    status: ASSET_STATUS_PENDING,
    bucket: bucket,
    originalKey: originalKey,
    variantsPrefix: variantsPrefix,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    createdAt: timestamp,
    updatedAt: timestamp,
    cleanupAt: cleanupAt,
    type: TypeAsset,
  };

  const assetItem = {
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixAsset + "#" + assetId,
    }),
    attributeValues: util.dynamodb.toMapValues(assetData),
  } as PutItemInputAttributeMap;

  // Update game to decrement remainingAssets
  const gameItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixGame,
    }),
    update: {
      expression:
        "SET #updatedAt = :updatedAt, #remainingAssets = #remainingAssets - :one",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#remainingAssets": "remainingAssets",
      },
      expressionValues: {
        ":updatedAt": { S: timestamp },
        ":one": { N: "1" },
      },
    },
    condition: {
      expression: "#remainingAssets > :zero",
      expressionNames: {
        "#remainingAssets": "remainingAssets",
      },
      expressionValues: {
        ":zero": { N: "0" },
      },
    },
  } as PutItemInputAttributeMap;

  // Update section to add asset ID - with user ownership condition
  const sectionItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
    update: {
      expression:
        "SET #updatedAt = :updatedAt, #assets = list_append(if_not_exists(#assets, :emptyList), :assetList)",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#assets": "assets",
      },
      expressionValues: {
        ":updatedAt": { S: timestamp },
        ":emptyList": { L: [] },
        ":assetList": { L: [{ S: assetId }] },
      },
    },
    condition: {
      expression: "#userId = :userId",
      expressionNames: {
        "#userId": "userId",
      },
      expressionValues: {
        ":userId": { S: identity.sub },
      },
    },
  } as PutItemInputAttributeMap;

  // Store asset data for next function
  context.stash.assetData = assetData;
  context.stash.input = input;

  return {
    operation: "TransactWriteItems",
    transactItems: [assetItem, gameItem, sectionItem],
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // Pass asset data to next function in pipeline
  return {
    assetData: context.stash.assetData,
    input: context.stash.input,
  };
}
