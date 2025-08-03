import { util, Context, PutItemInputAttributeMap } from "@aws-appsync/utils";
import { CreateNPCInput, PlayerSheetSummary } from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeNPC } from "../../lib/constants/entityTypes";
import { DataPlayerSheet } from "../../lib/dataTypes";
import environment from "../../environment.json";

// CheckGameFireflyAccess has already confirmed we are the firefly for this game

export function request(context: Context<{ input: CreateNPCInput }>): unknown {
  const input = context.arguments.input;
  const id = util.autoId();
  const timestamp = util.time.nowISO8601();

  const playerData = {
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
    remainingSections: context.prev.result.remainingSections,
  } as DataPlayerSheet;

  const playerItem = {
    operation: "PutItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixPlayer + "#" + id,
    }),
    attributeValues: util.dynamodb.toMapValues(
      playerData,
    ) as PutItemInputAttributeMap,
  };

  const gameItem = {
    operation: "UpdateItem",
    table: "Wildsea-" + environment.name,
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixGame,
    }),
    update: {
      expression: "SET #remainingCharacters = #remainingCharacters - :one",
      expressionNames: {
        "#remainingCharacters": "remainingCharacters",
      },
      expressionValues: {
        ":one": { N: "1" },
      },
    },
    condition: {
      expression: "#remainingCharacters > :zero",
      expressionNames: {
        "#remainingCharacters": "remainingCharacters",
      },
      expressionValues: {
        ":zero": { N: "0" },
      },
    },
  } as PutItemInputAttributeMap;

  context.stash.playerData = playerData;

  return {
    operation: "TransactWriteItems",
    transactItems: [playerItem, gameItem],
  };
}

export function response(context: Context): PlayerSheetSummary {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.stash.playerData;
}
