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
} from "../../lib/constants";

export function request(
  context: Context<QueryGetGameArgs>,
): DynamoDBQueryRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const id = context.arguments.id;
  const pk = "GAME#" + id;
  const expr: DynamoDBExpression = {
    expression: "#pk = :pk",
    expressionNames: {
      "#pk": "PK",
    },
    expressionValues: {
      ":pk": { S: pk },
    },
  };
  // Do a dynamodb query to get all records where pk = "GAME#" + id
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
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }
  if (
    !context.result ||
    !context.result.items ||
    context.result.items.length == 0
  ) {
    util.error("Game not found");
  }

  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const sheets: Record<string, PlayerSheet> = {};
  let game: Game | null = null;

  for (const data of context.result.items) {
    if (data.type == TypeGame) {
      game = makeGameData(data as DataGame, identity.sub);
    } else if (data.type == TypeCharacter || data.type == TypeFirefly) {
      const sheet = makeCharacterSheetData(data as DataPlayerSheet);
      sheets[sheet.userId] = sheet;
    } else if (data.type == TypeSection) {
      const section = makeSheetSection(data as DataSheetSection);
      const sheet = sheets[section.userId];
      if (sheet === undefined) {
        util.error("Sheet not found");
      }
      sheet.sections.push(section);
    } else {
      util.error("Unknown type: " + data.type);
    }
  }

  if (game === null) {
    util.error("Game record not found");
  }

  // Get an array of user IDs and sort them
  const userIds = Object.keys(sheets).sort();

  // Iterate through sorted user IDs and add corresponding sheets to the game
  for (const userId of userIds) {
    const sheet = sheets[userId];
    game.playerSheets.push(sheet);
  }

  return game;
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
    publicNotes: data.publicNotes,
    playerSheets: [],
    joinToken: joinToken,
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
  };
}

export function makeSheetSection(data: DataSheetSection): SheetSection {
  return {
    userId: data.userId,
    gameId: data.gameId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    type: data.type,
  };
}
