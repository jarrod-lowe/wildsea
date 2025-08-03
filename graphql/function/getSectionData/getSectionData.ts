import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import { DeleteSectionInput } from "../../../appsync/graphql";
import {
  DDBPrefixGame,
  DDBPrefixSection,
} from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: DeleteSectionInput }>,
): DynamoDBGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
  };
}

export function response(context: Context): null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // Store section data in stash for the deleteSection function to use
  if (context.result) {
    context.stash.sectionData = context.result;
  } else {
    // Section not found
    util.error("Section not found");
  }

  return null;
}
