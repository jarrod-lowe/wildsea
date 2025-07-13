import {
  util,
  Context,
  DynamoDBUpdateItemRequest,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import { GameSummary, UpdateGameInput } from "../../../appsync/graphql";
import { DDBPrefixGame } from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: UpdateGameInput }>,
): DynamoDBUpdateItemRequest {
  const { gameId, name, description } = context.arguments.input;
  const timestamp = util.time.nowISO8601();

  if (!context.identity) util.unauthorized();

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + gameId,
      SK: DDBPrefixGame,
    }),
    condition: {
      expression: "#fireflyUserId = :fireflyUserId",
      expressionNames: {
        "#fireflyUserId": "fireflyUserId",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":fireflyUserId": identity.sub,
      }),
    },
    update: {
      expression:
        "SET #gameName = :gameName, #gameDescription = :gameDescription, #updatedAt = :updatedAt",
      expressionNames: {
        "#gameName": "gameName",
        "#gameDescription": "gameDescription",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":gameName": name,
        ":gameDescription": description,
        ":updatedAt": timestamp,
      }),
    },
  };

  // The updateGameDataOnPlayers dynamoDB stream will cause the shadow game
  // information in the player sheets to be updated
}

export function response(context: Context): GameSummary | undefined {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return {
    gameId: context.result.gameId,
    gameName: context.result.gameName,
    gameType: context.result.gameType,
    gameDescription: context.result.gameDescription,
    createdAt: context.result.createdAt,
    updatedAt: context.result.updatedAt,
    type: context.result.type,
    fireflyUserId: context.result.fireflyUserId,
  };
}
