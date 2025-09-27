import { util, Context } from "@aws-appsync/utils";
import { AssetUploadTicket } from "../../../appsync/graphql";

export function request(context: Context): unknown {
  // Pass the data from previous function to Lambda
  const payload = {
    assetData: context.prev.result.assetData,
    input: context.prev.result.input,
  };

  return {
    operation: "Invoke",
    payload: payload,
  };
}

export function response(context: Context): AssetUploadTicket | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const result = context.result;
  const assetData = result.assetData;

  return {
    asset: {
      gameId: assetData.gameId,
      sectionId: assetData.sectionId,
      assetId: assetData.assetId,
      label: assetData.label,
      status: assetData.status,
      mimeType: assetData.mimeType,
      sizeBytes: assetData.sizeBytes,
      createdAt: assetData.createdAt,
      updatedAt: assetData.updatedAt,
      type: assetData.type,
    },
    uploadUrl: result.uploadUrl,
    uploadFields: JSON.stringify(result.uploadFields),
  };
}
