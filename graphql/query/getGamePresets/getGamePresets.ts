import { util, Context, DynamoDBQueryRequest } from "@aws-appsync/utils";
import { DDBPrefixGamePresets } from "../../lib/constants/dbPrefixes";
import type { DynamoDBGamePresets } from "../../lib/dataTypes";
import type {
  GetGamePresetsInput,
  GamePresetItem,
} from "../../../appsync/graphql";

export function request(
  context: Context<{ input: GetGamePresetsInput }>,
): DynamoDBQueryRequest {
  const input = context.arguments.input;
  const { dataSetName, language } = input;

  // Query for all GAMEPRESETS entries for the specified dataset and language
  return {
    operation: "Query",
    query: {
      expression: "#PK = :pk",
      expressionNames: {
        "#PK": "PK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `${DDBPrefixGamePresets}#${dataSetName}#${language}`,
      }),
    },
  };
}

export function response(
  context: Context<{ input: GetGamePresetsInput }>,
): GamePresetItem[] {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  const input = context.arguments.input;
  const { language } = input;
  const items = context.result.items as DynamoDBGamePresets[];
  const presets: GamePresetItem[] = [];

  items.forEach((item) => {
    presets.push({
      displayName: item.displayName,
      data: item.data,
      language: language,
    });
  });

  return presets;
}
