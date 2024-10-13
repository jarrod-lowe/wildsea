import { util, Context } from "@aws-appsync/utils";
import type {
  DynamoDBPutItemRequest,
  PutItemInputAttributeMap,
} from "@aws-appsync/utils/lib/resolver-return-types";
import { Game, CreateSectionInput } from "../../../appsync/graphql";
import {
  DDBPrefixGame,
  DDBPrefixSection,
  DDBPrefixSectionUser,
  TypeSection,
} from "../../lib/constants";

/* The pipeline has already oerformed the auth checks needed */

export function request(
  context: Context<{ input: CreateSectionInput }>,
): DynamoDBPutItemRequest {
  const input = context.arguments.input;
  const sectionId = util.autoId();
  const timestamp = util.time.nowISO8601();

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + sectionId,
    }),
    attributeValues: util.dynamodb.toMapValues({
      gameId: input.gameId,
      userId: input.userId,
      sectionId: sectionId,
      sectionName: input.sectionName,
      sectionType: input.sectionType,
      GSI1PK: DDBPrefixSectionUser + "#" + input.userId,
      content: input.content,
      position: input.position,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeSection,
    }) as PutItemInputAttributeMap,
  };
}

export function response(context: Context): Game | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }
  return context.result;
}
