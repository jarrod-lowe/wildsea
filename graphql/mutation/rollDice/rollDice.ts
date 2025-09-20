import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { DynamoDBBatchGetItemRequest } from "@aws-appsync/utils/lib/resolver-return-types";
import environment from "../../environment.json";
import type { DataPlayerSheet } from "../../lib/dataTypes";
import type {
  RollDiceInput,
  DiceRoll,
  SingleDie,
  Dice,
} from "../../../appsync/graphql";
import { DDBPrefixGame, DDBPrefixPlayer } from "../../lib/constants/dbPrefixes";
import { TypeDiceRoll, TypeNPC } from "../../lib/constants/entityTypes";
import { RollTypes, Grades } from "../../lib/constants/rollTypes";

export function request(
  context: Context<{ input: RollDiceInput }>,
): DynamoDBBatchGetItemRequest {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.arguments.input;

  // Store input in stash for response function
  context.stash.input = input;
  context.stash.playerId = identity.sub;
  context.stash.onBehalfOf = input.onBehalfOf;

  // Always use BatchGetItem for consistency
  const keys = [
    util.dynamodb.toMapValues({
      PK: DDBPrefixGame + "#" + input.gameId,
      SK: DDBPrefixPlayer + "#" + identity.sub,
    }),
  ];

  // Add NPC record to batch if rolling on behalf of NPC (and it's different from current user)
  if (input.onBehalfOf && input.onBehalfOf !== identity.sub) {
    keys.push(
      util.dynamodb.toMapValues({
        PK: DDBPrefixGame + "#" + input.gameId,
        SK: DDBPrefixPlayer + "#" + input.onBehalfOf,
      }),
    );
  }

  const tableName = "Wildsea-" + environment.name;

  return {
    operation: "BatchGetItem",
    tables: {
      [tableName]: {
        keys,
      },
    },
  };
}

export function response(context: Context): DiceRoll {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  const input = context.stash.input as RollDiceInput;
  const playerId = context.stash.playerId as string;
  const onBehalfOf = context.stash.onBehalfOf as string | undefined;

  // Handle BatchGetItem result
  const tableName = "Wildsea-" + environment.name;
  const results = context.result.data[tableName] as DataPlayerSheet[];

  // Find player record (always required)
  const playerSheet = results.find(
    (record) => record != null && record.userId === identity.sub,
  );
  if (!playerSheet) {
    util.unauthorized();
  }

  let rollerName: string;
  let actualPlayerId: string;
  let rolledBy: string;
  let proxyRoll: boolean;

  if (onBehalfOf && onBehalfOf !== identity.sub) {
    // Find NPC record
    const npcSheet = results.find(
      (record) => record.userId === onBehalfOf && record.type == TypeNPC,
    );
    if (!npcSheet) {
      util.unauthorized();
    }

    // Use NPC's details for the roll
    rollerName = npcSheet.characterName;
    actualPlayerId = npcSheet.userId;
    rolledBy = playerSheet.characterName;
    proxyRoll = true;
  } else {
    // Use player's details for the roll (either no onBehalfOf or onBehalfOf is self)
    rollerName = playerSheet.characterName;
    actualPlayerId = playerId;
    rolledBy = playerSheet.characterName;
    proxyRoll = false;
  }

  // Roll each die in the input array
  const rolledDice: Dice[] = [];
  let totalValue = 0;

  for (const diceInput of input.dice) {
    // Delta Green percentile dice use 0-99 range, other dice use 1-size range
    const baseRolledValue =
      input.rollType === RollTypes.DELTA_GREEN && diceInput.size === 100
        ? Math.floor(Math.random() * 100) // 0-99 for percentile rolls
        : Math.floor(Math.random() * diceInput.size) + 1; // 1-size for standard dice

    // Apply modifier if present
    const modifier = diceInput.modifier || 0;
    const finalValue = baseRolledValue + modifier;
    totalValue += finalValue;

    // Convert DiceInput to SingleDie (the only type in Dice union currently)
    const rolledDie: SingleDie = {
      __typename: "SingleDie",
      type: diceInput.type,
      size: diceInput.size,
      value: finalValue,
    };

    rolledDice.push(rolledDie);
  }

  // Calculate grade based on roll type using total value
  const grade = calculateGrade(input.rollType, totalValue, input.target);

  // Generate random message index for result text variation (0-9999)
  const messageIndex = Math.floor(Math.random() * 10000);

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
    playerId: actualPlayerId,
    playerName: rollerName,
    dice: outputDice,
    rollType: input.rollType,
    target: input.target,
    grade: grade,
    action: input.action || null,
    diceList: rolledDice,
    value: totalValue,
    rolledAt: util.time.nowISO8601(),
    rolledBy: rolledBy,
    proxyRoll: proxyRoll,
    type: TypeDiceRoll,
    messageIndex: messageIndex,
    messageType: input.messageType || null,
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
  // Handle special cases: 00 and 01 are always critical success
  if (rolledValue === 0 || rolledValue === 1) {
    return Grades.CRITICAL_SUCCESS;
  }

  // Check for matching digits (doubles): 11, 22, 33, 44, 55, 66, 77, 88, 99
  if (rolledValue >= 11) {
    const tens = Math.floor(rolledValue / 10);
    const units = rolledValue % 10;

    if (tens === units) {
      // Matching digits: critical success if <= target, fumble if > target
      if (rolledValue <= target) {
        return Grades.CRITICAL_SUCCESS;
      } else {
        return Grades.FUMBLE;
      }
    }
  }

  // Standard success/failure check
  if (rolledValue <= target) {
    return Grades.SUCCESS;
  } else {
    return Grades.FAILURE;
  }
}
