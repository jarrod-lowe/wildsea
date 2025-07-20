import { util, Context, DynamoDBGetItemRequest } from "@aws-appsync/utils";
import type { GetCharacterTemplateInput } from "../../../appsync/graphql";
import { DDBPrefixTemplate } from "../../lib/constants/dbPrefixes";

export function request(
  context: Context<{ input: GetCharacterTemplateInput }>,
): DynamoDBGetItemRequest {
  const input = context.arguments.input;
  const { templateName, gameType, language } = input;

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: DDBPrefixTemplate + "#" + gameType + "#" + language,
      SK: DDBPrefixTemplate + "#" + templateName,
    }),
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type);
  }

  if (!context.result) {
    util.error("Template not found", "NotFound");
  }

  // Parse the sections array from the template
  const sections = JSON.parse(context.result.sections);

  // Parse the content field for each section (it's double-encoded JSON)
  return sections.map(
    (section: { content: string; [key: string]: unknown }) => ({
      ...section,
      content: JSON.parse(section.content),
    }),
  );
}
