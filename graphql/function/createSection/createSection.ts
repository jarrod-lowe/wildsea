import { util, Context } from "@aws-appsync/utils";
import type { PutItemInputAttributeMap } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import { SheetSection, CreateSectionInput } from "../../../appsync/graphql";
import {
  DDBPrefixGame,
  DDBPrefixSection,
  DDBPrefixSectionUser,
  DDBPrefixPlayer,
} from "../../lib/constants/dbPrefixes";
import { TypeSection } from "../../lib/constants/entityTypes";

/* The pipeline has already oerformed the auth checks needed */

export function request(
  context: Context<{ input: CreateSectionInput }>,
): unknown {
  const input = context.arguments.input;
  const sectionId = util.autoId();
  const timestamp = util.time.nowISO8601();

  // Update player sheet to decrement remainingSections
  const playerItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixPlayer + "#" + input.userId,
    }),
    update: {
      expression:
        "SET #updatedAt = :updatedAt, #remainingSections = #remainingSections - :one",
      expressionNames: {
        "#updatedAt": "updatedAt",
        "#remainingSections": "remainingSections",
      },
      expressionValues: {
        ":updatedAt": { S: timestamp },
        ":one": { N: "1" },
      },
    },
    condition: {
      expression: "#remainingSections > :zero",
      expressionNames: {
        "#remainingSections": "remainingSections",
      },
      expressionValues: {
        ":zero": { N: "0" },
      },
    },
  } as PutItemInputAttributeMap;

  // Create the section
  const sectionData = {
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
    playerType: context.stash.playerType,
  };

  const sectionItem = {
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixSection + "#" + sectionId,
    }),
    attributeValues: util.dynamodb.toMapValues(sectionData),
  } as PutItemInputAttributeMap;

  // Store section data for response
  context.stash.sectionData = sectionData;

  return {
    operation: "TransactWriteItems",
    transactItems: [playerItem, sectionItem],
  };
}

export function response(context: Context): SheetSection | null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }
  return context.stash.sectionData;
}
