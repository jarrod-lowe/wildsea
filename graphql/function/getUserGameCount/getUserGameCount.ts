import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { MaxGamesPerPlayer } from "../../lib/constants/defaults";

export function request(context: Context): unknown {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  return {
    operation: "Query",
    index: "GSI1",
    select: "COUNT",
    query: {
      expression: "#gsi1pk = :gsi1pk",
      expressionNames: {
        "#gsi1pk": "GSI1PK",
      },
      expressionValues: {
        ":gsi1pk": util.dynamodb.toString("USER#" + identity.sub),
      },
    },
  };
}

export function response(context: Context): unknown {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // Get the count from DynamoDB COUNT response
  const currentGameCount = context.result?.scannedCount || 0;

  // Check if quota is exceeded
  if (currentGameCount >= MaxGamesPerPlayer) {
    util.error(
      `Game quota exceeded. You are in ${currentGameCount}/${MaxGamesPerPlayer} games. Please leave a game before creating or joining another.`,
      "GAME_QUOTA_EXCEEDED",
    );
  }

  // Store game count and remaining quota in stash for next pipeline function
  context.stash.userGameCount = currentGameCount;
  context.stash.remainingGames = MaxGamesPerPlayer - currentGameCount;

  // Return the previous result to pass through the game data from getGameWithToken
  return context.prev.result;
}
