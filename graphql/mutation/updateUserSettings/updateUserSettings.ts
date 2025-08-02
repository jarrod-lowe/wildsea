import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBPutItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type {
  UserSettings,
  UpdateUserSettingsInput,
} from "../../../appsync/graphql";
import { DDBPrefixSettings } from "../../lib/constants/dbPrefixes";
import { TypeSettings } from "../../lib/constants/entityTypes";
import { MaxUserSettingsSize } from "../../lib/constants/defaults";
import { getTranslatedMessage } from "../../lib/i18n";

export function request(
  context: Context<{ input: UpdateUserSettingsInput }>,
): DynamoDBPutItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const { settings } = context.arguments.input;

  // Validate size limit (settings is already a JSON string)
  const settingsSize = settings.length;
  if (settingsSize > MaxUserSettingsSize) {
    util.error(
      getTranslatedMessage(
        "settings.sizeExceeded",
        "en",
        `${settingsSize} bytes`,
      ),
      "SettingsSizeExceededException",
    );
  }

  const now = util.time.nowISO8601();

  const item: UserSettings = {
    userId: identity.sub,
    settings: settings,
    type: TypeSettings,
    createdAt: now,
    updatedAt: now,
  };

  return {
    operation: "PutItem",
    key: {
      PK: util.dynamodb.toString(`${DDBPrefixSettings}#${identity.sub}`),
      SK: util.dynamodb.toString(`${DDBPrefixSettings}#`),
    },
    attributeValues: util.dynamodb.toMapValues(item),
  };
}

export function response(
  context: Context<{ input: UpdateUserSettingsInput }>,
): UserSettings {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  return context.result as UserSettings;
}
