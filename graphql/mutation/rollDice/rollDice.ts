import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import type { DataPlayerSheet } from "../../lib/dataTypes";
import type {
  RollDiceInput,
  DiceRoll,
  SingleDie,
  Dice,
} from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeDiceRoll } from "../../lib/constants/entityTypes";
import { RollTypes, Grades } from "../../lib/constants/rollTypes";

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

  // Check game access by getting the player record
  const key = {
    PK: DDBPrefixGame + "#" + input.gameId,
    SK: DDBPrefixPlayer + "#" + identity.sub,
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

  const playerSheet = context.result as DataPlayerSheet;
  if (!playerSheet) {
    util.error("Player not found in game", "NOT_FOUND");
  }

  // Check if user has access to this player sheet
  if (playerSheet.userId !== identity.sub) {
    util.unauthorized();
  }

  const input = context.stash.input as RollDiceInput;
  const playerId = context.stash.playerId as string;

  // Roll each die in the input array
  const rolledDice: Dice[] = [];
  let totalValue = 0;

  for (const diceInput of input.dice) {
    const rolledValue = Math.floor(Math.random() * diceInput.size) + 1;
    totalValue += rolledValue;

    // Convert DiceInput to SingleDie (the only type in Dice union currently)
    const rolledDie: SingleDie = {
      __typename: "SingleDie",
      type: diceInput.type,
      size: diceInput.size,
      value: rolledValue,
    };

    rolledDice.push(rolledDie);
  }

  // Calculate grade based on roll type using total value
  const grade = calculateGrade(input.rollType, totalValue, input.target);

  // Convert input dice to output dice format
  const outputDice: Dice[] = input.dice.map(
    (diceInput): SingleDie => ({
      __typename: "SingleDie",
      type: diceInput.type,
      size: diceInput.size,
      value: 0, // Original dice spec has no rolled value
    }),
  );

  const result: DiceRoll = {
    gameId: input.gameId,
    playerId: playerId,
    playerName: playerSheet.characterName,
    dice: outputDice,
    rollType: input.rollType,
    target: input.target,
    grade: grade,
    action: input.action || null,
    diceList: rolledDice,
    value: totalValue,
    rolledAt: util.time.nowISO8601(),
    type: TypeDiceRoll,
  };

  return result;
}

function calculateGrade(
  rollType: string,
  rolledValue: number,
  target: number,
): string {
  switch (rollType) {
    case RollTypes.SUM:
      return Grades.NEUTRAL;

    case RollTypes.DELTA_GREEN:
      return calculateDeltaGreenGrade(rolledValue, target);

    default:
      return Grades.NEUTRAL;
  }
}

function calculateDeltaGreenGrade(rolledValue: number, target: number): string {
  // Handle special cases for 01 and 00
  if (rolledValue === 1) {
    return Grades.CRITICAL_SUCCESS;
  }
  if (rolledValue === 100) {
    return Grades.FUMBLE;
  }

  // Check if all digits are the same (for 2-digit numbers)
  // Extract tens and units digits
  const tens = Math.floor(rolledValue / 10);
  const units = rolledValue % 10;
  const allDigitsSame = tens === units;

  if (allDigitsSame) {
    if (rolledValue <= target) {
      return Grades.CRITICAL_SUCCESS;
    } else {
      return Grades.FUMBLE;
    }
  }

  // Standard success/failure check
  if (rolledValue <= target) {
    return Grades.SUCCESS;
  } else {
    return Grades.FAILURE;
  }
}
