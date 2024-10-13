import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type {
  DynamoDBExpression,
  DynamoDBQueryRequest,
} from "@aws-appsync/utils/lib/resolver-return-types";
import type {
  Game,
  PlayerSheet,
  SheetSection,
  QueryGetGameArgs,
  GetGameInput,
} from "../../../appsync/graphql";
import type {
  DataPlayerSheet,
  Data,
  DataSheetSection,
  DataGame,
} from "../../lib/dataTypes";
import {
  TypeCharacter,
  TypeFirefly,
  TypeSection,
  TypeGame,
  DDBPrefixGame,
  TypeShip,
} from "../../lib/constants";

export function request(
  context: Context<{ input: GetGameInput }>,
): DynamoDBQueryRequest {
  validateIdentity(context);
  return buildDynamoDBQuery(context.arguments.input.gameId);
}

function validateIdentity(context: Context<QueryGetGameArgs>): void {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();
}

function buildDynamoDBQuery(id: string): DynamoDBQueryRequest {
  const pk = DDBPrefixGame + "#" + id;
  const expr: DynamoDBExpression = {
    expression: "#pk = :pk",
    expressionNames: {
      "#pk": "PK",
    },
    expressionValues: {
      ":pk": { S: pk },
    },
  };
  return {
    operation: "Query",
    query: expr,
  };
}

type ResponseContext = Context<
  QueryGetGameArgs,
  Record<string, never>,
  undefined,
  undefined,
  { items: Data[] }
>;

export function response(context: ResponseContext): Game | undefined {
  validateResponse(context);
  validateIdentity(context);

  const identity = context.identity as AppSyncIdentityCognito;
  const sheets = buildPlayerSheets(context.result.items);
  const game = findAndBuildGame(context.result.items, identity.sub);

  addSheetsToGame(game, sheets);
  return game;
}

function validateResponse(context: ResponseContext): void {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  if (!context.result?.items?.length) {
    util.error("Game not found");
  }
}

function buildPlayerSheets(items: Data[]): Record<string, PlayerSheet> {
  const sheets: Record<string, PlayerSheet> = {};
  items.forEach((data) => {
    if (
      data.type === TypeCharacter ||
      data.type === TypeFirefly ||
      data.type === TypeShip
    ) {
      const sheet = makeCharacterSheetData(data as DataPlayerSheet);
      sheets[sheet.userId] = sheet;
    } else if (data.type === TypeSection) {
      addSectionToSheet(sheets, data as DataSheetSection);
    } else if (data.type != TypeGame) {
      util.error("Unknown type: " + data.type);
    }
  });
  return sheets;
}

function addSectionToSheet(
  sheets: Record<string, PlayerSheet>,
  data: DataSheetSection,
): void {
  const section = makeSheetSection(data);
  const sheet = sheets[section.userId];
  if (sheet === undefined) {
    util.error("Sheet not found");
  }
  sheet.sections.push(section);
}

function findAndBuildGame(items: Data[], sub: string): Game {
  const gameData = items.find((data) => data.type === TypeGame) as DataGame;
  if (!gameData) {
    util.error("Game record not found");
  }
  return makeGameData(gameData, sub);
}

function addSheetsToGame(
  game: Game,
  sheets: Record<string, PlayerSheet>,
): void {
  const userIds = Object.keys(sheets).sort(); // NOSONAR we do not want a locale-based sort
  userIds.forEach((userId) => {
    game.playerSheets.push(sheets[userId]);
  });
}

export function makeGameData(data: DataGame, sub: string): Game {
  let joinToken = null;
  if (data.fireflyUserId == sub) {
    joinToken = data.joinToken;
  }
  return {
    gameId: data.gameId,
    gameName: data.gameName,
    gameDescription: data.gameDescription,
    playerSheets: [],
    joinToken: joinToken,
    fireflyUserId: data.fireflyUserId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    type: data.type,
  };
}

export function makeCharacterSheetData(data: DataPlayerSheet): PlayerSheet {
  return {
    userId: data.userId,
    gameId: data.gameId,
    characterName: data.characterName,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    type: data.type,
    sections: [],
    fireflyUserId: data.fireflyUserId,
  };
}

export function makeSheetSection(data: DataSheetSection): SheetSection {
  return {
    userId: data.userId,
    gameId: data.gameId,
    sectionId: data.sectionId,
    sectionName: data.sectionName,
    sectionType: data.sectionType,
    content: data.content,
    position: data.position,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    type: data.type,
  };
}
