import { util, Context, DynamoDBQueryRequest } from "@aws-appsync/utils";
import type { GetCharacterTemplatesInput } from "../../../appsync/graphql";
import { DDBPrefixTemplate } from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: GetCharacterTemplatesInput }>,
): DynamoDBQueryRequest {
  const input = context.arguments.input;
  const { gameType, language } = input;

  return {
    operation: "Query",
    query: {
      expression: "#PK = :pk",
      expressionNames: {
        "#PK": "PK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":pk": DDBPrefixTemplate + "#" + gameType + "#" + language,
      }),
    },
    projection: {
      expression: "#templateName, #displayName, #gameType, #language",
      expressionNames: {
        "#templateName": "templateName",
        "#displayName": "displayName",
        "#gameType": "gameType",
        "#language": "language",
      },
    },
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  return context.result.items;
}
