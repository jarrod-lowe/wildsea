import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type {
  DynamoDBPutItemRequest,
  PutItemInputAttributeMap,
} from "@aws-appsync/utils/lib/resolver-return-types";
import { Game, CreateSectionInput } from "../../../appsync/graphql";
import { DDBPrefixSection, TypeSection } from "../../lib/constants";

export function request(
  context: Context<{ input: CreateSectionInput }>,
): DynamoDBPutItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const sectionId = util.autoId();
  const timestamp = util.time.nowISO8601();

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: "GAME#" + input.gameId,
      SK: DDBPrefixSection + "#" + sectionId,
    }),
    attributeValues: util.dynamodb.toMapValues({
      gameId: input.gameId,
      userId: identity.sub,
      sectionId: sectionId,
      sectionName: input.sectionName,
      sectionType: input.sectionType,
      content: input.content,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeSection,
    }) as PutItemInputAttributeMap,
  };
}

export function response(context: Context): Game | null {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return null;
  }
  return context.result;
}
