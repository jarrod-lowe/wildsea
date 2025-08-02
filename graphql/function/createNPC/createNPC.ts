import {
  util,
  Context,
  DynamoDBPutItemRequest,
  PutItemInputAttributeMap,
} from "@aws-appsync/utils";
import { CreateNPCInput, PlayerSheetSummary } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeNPC } from "../../lib/constants/entityTypes";
import { DataPlayerSheet } from "../../lib/dataTypes";

// CheckGameFireflyAccess has already confirmed we are the firefly for this game

export function request(
  context: Context<{ input: CreateNPCInput }>,
): DynamoDBPutItemRequest {
  const input = context.arguments.input;
  const id = util.autoId();
  const timestamp = util.time.nowISO8601();

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixPlayer + "#" + id,
    }),
    attributeValues: util.dynamodb.toMapValues({
      gameId: input.gameId,
      userId: id,
      gameName: context.prev.result.gameName,
      gameType: context.prev.result.gameType,
      gameDescription: context.prev.result.gameDescription,
      characterName: input.characterName,
      fireflyUserId: context.prev.result.fireflyUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      type: TypeNPC,
    } as DataPlayerSheet) as PutItemInputAttributeMap,
  };
}

export function response(context: Context): PlayerSheetSummary {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.result;
}
