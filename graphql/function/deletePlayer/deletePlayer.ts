import { util, Context } from "@aws-appsync/utils";
import type {
  DeletePlayerInput,
  PlayerSheetSummary,
} from "../../../appsync/graphql";
import environment from "../../environment.json";
import {
  DDBPrefixGame,
  DDBPrefixPlayer,
  DDBPrefixSection,
} from "../../lib/constants/dbPrefixes";
import { TypeCharacter } from "../../lib/constants/entityTypes";
import { DataSheetSection } from "../../lib/dataTypes";
import { authIsIam } from "../../lib/auth";

export function request(
  context: Context<{ input: DeletePlayerInput }>,
): unknown {
  // Auth has already been checked

  if (!authIsIam(context.identity)) {
    if (context.stash.userId == context.stash.fireflyUserId) {
      util.error("Cannot delete firefly sheet");
    }
  }

  const sections = context.prev.result.items as DataSheetSection[];
  const gameId = context.arguments.input.gameId;
  const userId = context.arguments.input.userId;

  // Prepare delete operations for all sections
  const deleteSectionOps = sections.map((section) => ({
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixSection + "#" + section.sectionId,
    }),
    table: "Wildsea-" + environment.name,
    operation: "DeleteItem",
  }));

  // Prepare delete operations
  const deletePlayerOp = {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixPlayer + "#" + userId,
    }),
    table: "Wildsea-" + environment.name,
    operation: "DeleteItem",
  };

  const updateGameOp = {
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixGame,
    }),
    table: "Wildsea-" + environment.name,
    operation: "UpdateItem",
    update: {
      expression: "DELETE players :userId",
      expressionValues: {
        ":userId": util.dynamodb.toStringSet([userId]),
      },
    },
  };

  // Combine all operations
  const transactItems = [...deleteSectionOps, deletePlayerOp, updateGameOp];

  return {
    operation: "TransactWriteItems",
    transactItems: transactItems,
  };
}

export function response(context: Context): PlayerSheetSummary {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  const timestamp = util.time.nowISO8601();

  return {
    gameId: context.arguments.input.gameId,
    userId: context.arguments.input.userId,
    characterName: context.stash.characterName,
    gameDescription: context.stash.gameDescription,
    gameName: context.stash.gameName,
    createdAt: context.stash.createdAt,
    updatedAt: timestamp,
    type: TypeCharacter,
    deleted: true,
  };
}
