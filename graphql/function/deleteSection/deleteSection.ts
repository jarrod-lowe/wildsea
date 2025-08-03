import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import { SheetSection, DeleteSectionInput } from "../../../appsync/graphql";
import {
  DDBPrefixGame,
  DDBPrefixSection,
  DDBPrefixPlayer,
} from "../../lib/constants/dbPrefixes";
import { TypeNPC } from "../../lib/constants/entityTypes";
import environment from "../../environment.json";

export function request(
  context: Context<{ input: DeleteSectionInput }>,
): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;
  const timestamp = util.time.nowISO8601();

  // Get the section data from stash (set by getSectionData pipeline function)
  const sectionData = context.stash.sectionData;
  if (!sectionData) {
    util.error("Section data not found in stash");
  }

  // Update player sheet to increment remainingSections
  const playerItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixPlayer + "#" + sectionData.userId,
    }),
    update: {
      expression:
        "SET #updatedAt = :updatedAt, #remainingSections = #remainingSections + :one",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#remainingSections": "remainingSections",
      },
      expressionValues: {
        ":updatedAt": { S: timestamp },
        ":one": { N: "1" },
      },
    },
  } as PutItemInputAttributeMap;

  // Delete the section
  const sectionItem = {
    operation: "DeleteItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + input.sectionId,
    }),
    condition: {
      expression: "#userId = :userId OR #playerType = :playerType",
      expressionNames: {
        "#userId": "userId",
        "#playerType": "playerType",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":userId": identity.sub,
        ":playerType": TypeNPC,
      }),
    },
  } as PutItemInputAttributeMap;

  // Section data is already in stash from getSectionData pipeline function

  return {
    operation: "TransactWriteItems",
    transactItems: [playerItem, sectionItem],
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    if (context.error.type === "DynamoDB:ConditionalCheckFailedException")
      util.unauthorized();
    util.error(context.error.message, context.error.type, context.result);
  }

  // If the deletion was successful, return a SheetSection object with the deleted flag set to true
  // We use the section data from stash since the transaction doesn't return the deleted item
  return { ...context.stash.sectionData, deleted: true };
}
