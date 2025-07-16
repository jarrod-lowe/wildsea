import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataGame } from "../../lib/dataTypes";
import type {
  RollDiceInput,
  DiceRoll,
  SingleDie,
} from "../../../appsync/graphql";
import { DDBPrefixGame } from "../../lib/constants/dbPrefixes";
import { TypeDiceRoll } from "../../lib/constants/entityTypes";

export function request(
  context: Context<{ input: RollDiceInput }>,
): DynamoDBGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;

  // Store input in stash for response function
  context.stash.input = input;
  context.stash.playerId = identity.sub;

  // Check game access by getting the game
  const key = {
    PK: DDBPrefixGame + "#" + input.gameId,
    SK: DDBPrefixGame,
  };

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues(key),
  };
}

export function response(context: Context): DiceRoll {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const game = context.result as DataGame;
  if (!game) {
    util.error("Game not found", "NOT_FOUND");
  }

  // Check if user has access to this game
  if (!permitted(identity, game)) {
    util.unauthorized();
  }

  const input = context.stash.input as RollDiceInput;
  const playerId = context.stash.playerId as string;

  // Parse and validate dice notation
  const diceSize = parseDiceNotation(input.dice);

  // Roll the dice
  const rolledValue = Math.floor(Math.random() * diceSize) + 1;

  // Calculate grade based on roll type
  const grade = calculateGrade(input.rollType, rolledValue, input.target);

  // Create dice list
  const diceList: SingleDie[] = [
    {
      type: "single",
      size: diceSize,
      value: rolledValue,
    },
  ];

  const result: DiceRoll = {
    gameId: input.gameId,
    playerId: playerId,
    dice: input.dice,
    rollType: input.rollType,
    target: input.target,
    grade: grade,
    action: input.action || null,
    diceList: diceList,
    rolledAt: util.time.nowISO8601(),
    type: TypeDiceRoll,
  };

  return result;
}

function permitted(identity: AppSyncIdentityCognito, data: DataGame): boolean {
  if (data === null) {
    return false;
  }

  if (data.fireflyUserId === identity.sub) {
    return true;
  }

  if (data.players) {
    for (const player of data.players) {
      if (player === identity.sub) {
        return true;
      }
    }
  }

  return false;
}

function parseDiceNotation(dice: string): number {
  if (!dice.startsWith("1d")) {
    util.error(
      "Invalid dice format. Must be in format '1dXX'",
      "INVALID_DICE_FORMAT",
    );
  }

  const diceSizeStr = dice.substring(2);
  if (!diceSizeStr || diceSizeStr.length === 0) {
    util.error(
      "Invalid dice format. Must be in format '1dXX'",
      "INVALID_DICE_FORMAT",
    );
  }

  // Convert string to number using arithmetic coercion
  const diceSize = diceSizeStr * 1;
  if (diceSize < 2 || diceSize > 1000) {
    util.error(
      "Invalid dice format. Must be in format '1dXX' where XX is a number between 2 and 1000",
      "INVALID_DICE_FORMAT",
    );
  }

  return diceSize;
}

function calculateGrade(
  rollType: string,
  rolledValue: number,
  target: number,
): string {
  switch (rollType.toLowerCase()) {
    case "simple":
      return rolledValue >= target ? "success" : "failure";

    case "d100":
    case "percentile":
      return calculateD100Grade(rolledValue, target);

    default:
      return rolledValue >= target ? "success" : "failure";
  }
}

function calculateD100Grade(rolledValue: number, target: number): string {
  if (rolledValue <= target) {
    if (rolledValue <= Math.floor(target / 5)) {
      return "extreme_success";
    }
    if (rolledValue <= Math.floor(target / 2)) {
      return "hard_success";
    }
    return "regular_success";
  }

  if (rolledValue >= 96) {
    return "fumble";
  }
  return "failure";
}
