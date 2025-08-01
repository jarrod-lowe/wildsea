import { util, Context, DynamoDBQueryRequest } from "@aws-appsync/utils";
import { DDBPrefixGameDefaults } from "../../lib/constants/dbPrefixes";
import type { DynamoDBGameDefaults } from "../../lib/dataTypes";
import type {
  GetGameTypesInput,
  GameTypeMetadata,
} from "../../../appsync/graphql";

export function request(
  context: Context<{ input: GetGameTypesInput }>,
): DynamoDBQueryRequest {
  const input = context.arguments.input;
  const { language } = input;

  // Query for all GAMEDEFAULTS entries for the specified language
  return {
    operation: "Query",
    query: {
      expression: "#PK = :pk",
      expressionNames: {
        "#PK": "PK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `${DDBPrefixGameDefaults}#${language}`,
      }),
    },
  };
}

export function response(
  context: Context<{ input: GetGameTypesInput }>,
): GameTypeMetadata[] {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  const input = context.arguments.input;
  const { language } = input;
  const items = context.result.items as DynamoDBGameDefaults[];
  const gameTypes: GameTypeMetadata[] = [];
  items.forEach((item) => {
    gameTypes.push({
      gameType: item.gameType,
      displayName: item.displayName,
      language: language,
    });
  });

  return gameTypes;
}
