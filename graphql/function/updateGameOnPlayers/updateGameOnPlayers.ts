import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { UpdateGameInput } from "../../../appsync/graphql";
import environment from "../../environment.json";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { Empty } from "../../lib/dataTypes";

type UserIdItem = {
  userId: string;
};

export function request(context: Context<{ input: UpdateGameInput }>): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const timestamp = util.time.nowISO8601();
  context.stash.updatedAt = timestamp;

  const userIdItems = context.prev.result.items as UserIdItem[];
  const gameId = context.arguments.input.gameId;

  // Prepare delete operations for all sections
  const updatePlayerOps = userIdItems.map((userIdItem) => ({
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixPlayer + "#" + userIdItem.userId,
    }),
    table: "Wildsea-" + environment.name,
    update: {
      expression:
        "SET #gameName = :gameName, #gameDescription = :gameDescription, #updatedAt = :updatedAt",
      expressionNames: {
        "#gameName": "gameName",
        "#gameDescription": "gameDescription",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":gameName": context.args.input.name,
        ":gameDescription": context.arguments.input.description,
        ":updatedAt": timestamp,
      }),
    },
    operation: "UpdateItem",
  }));

  return {
    operation: "TransactWriteItems",
    transactItems: updatePlayerOps,
  };
}

export function response(context: Context): Empty {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  return {};
}
