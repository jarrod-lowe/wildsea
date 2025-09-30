import { util, Context } from "@aws-appsync/utils";
import { DeleteAssetInput } from "../../../appsync/graphql";

export function request(context: Context<{ input: DeleteAssetInput }>): never {
  const input = context.arguments.input;
  util.error(
    `deleteAsset not yet implemented for game ${input.gameId}`,
    "NotImplemented",
  );
}

export function response(context: Context): unknown {
  return context.result;
}
