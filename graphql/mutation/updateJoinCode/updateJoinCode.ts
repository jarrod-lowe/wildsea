import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBUpdateItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type {
  GameSummary,
  UpdateJoinCodeInput,
} from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixJoin } from "../../lib/constants/dbPrefixes";
import { generateJoinCode } from "../../lib/joinCode";

export function request(
  context: Context<{ input: UpdateJoinCodeInput }>,
): DynamoDBUpdateItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const { gameId } = context.arguments.input;
  const newJoinCode: string = generateJoinCode();

  const key: Record<string, string> = {
    PK: `${DDBPrefixGame}#${gameId}`,
    SK: DDBPrefixGame,
  };

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues(key),
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
        "SET #joinCode = :joinCode, #GSI1PK = :gsi1pk, #updatedAt = :updatedAt",
      expressionNames: {
        "#joinCode": "joinCode",
        "#GSI1PK": "GSI1PK",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":joinCode": newJoinCode,
        ":gsi1pk": `${DDBPrefixJoin}#${newJoinCode}`,
        ":updatedAt": util.time.nowISO8601(),
      }),
    },
  };
}

export function response(
  context: Context<{ input: UpdateJoinCodeInput }>,
): GameSummary {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const result = context.result as GameSummary;
  return {
    gameId: result.gameId,
    gameName: result.gameName,
    gameType: result.gameType,
    gameDescription: result.gameDescription,
    joinCode: result.joinCode,
    fireflyUserId: result.fireflyUserId,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    type: result.type,
  };
}
