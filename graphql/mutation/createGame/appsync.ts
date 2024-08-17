import {
  util,
  Context,
  DynamoDBPutItemRequest,
  AppSyncIdentityCognito,
  PutItemInputAttributeMap,
} from "@aws-appsync/utils";

/**
 * A CreateGameInput creates a Game.
 * They are stored in DynamoDB with a PK of `GAME#<id>` and an SK of `GAME`.
 * The ID is a UUID
 * The fireflyUserId is the Cognito ID of the user
 */

interface CreateGameInput {
  name: string;
  description?: string;
}

export function request(
  context: Context<{ input: CreateGameInput }>,
): DynamoDBPutItemRequest {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing." as string);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing." as string);
  }

  const input = context.arguments.input;
  const id = util.autoId();
  const timestamp = util.time.nowISO8601();
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ PK: "GAME#" + id, SK: "GAME" }),
    attributeValues: util.dynamodb.toMapValues({
      name: input.name,
      description: input.description,
      id: id,
      fireflyUserId: identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp,
    }) as PutItemInputAttributeMap,
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return;
  }
  return context.result;
}
