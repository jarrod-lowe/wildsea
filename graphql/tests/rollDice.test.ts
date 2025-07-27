import { request, response } from "../mutation/rollDice/rollDice";
import { Context } from "@aws-appsync/utils";
import { RollTypes, Grades } from "../lib/constants/rollTypes";
import type { RollDiceInput } from "../../appsync/graphql";
import environment from "../environment.json";

// Mock the util functions
jest.mock("@aws-appsync/utils", () => ({
  util: {
    unauthorized: jest.fn(() => {
      throw new Error("Unauthorized");
    }),
    error: jest.fn((message: string) => {
      throw new Error(message);
    }),
    dynamodb: {
      toMapValues: jest.fn((obj) => obj),
    },
    time: {
      nowISO8601: jest.fn(() => "2023-01-01T00:00:00.000Z"),
    },
  },
}));

const mockPlayerSheet = {
  userId: "test-user-id",
  gameId: "test-game-id",
  characterName: "Test Character",
  type: "CHARACTER",
};

const mockShipSheet = {
  userId: "ship-id",
  gameId: "test-game-id",
  characterName: "Test Ship",
  type: "SHIP",
};

interface MockContextOverrides {
  input?: Partial<RollDiceInput>;
  stash?: Record<string, unknown>;
  result?: unknown[];
  identity?: { sub: string };
}

const createMockContext = (overrides: MockContextOverrides = {}) => {
  const tableName = "Wildsea-" + environment.name;

  return {
    identity: {
      sub: "test-user-id",
      ...overrides.identity,
    },
    arguments: {
      input: {
        gameId: "test-game-id",
        dice: [{ type: "d100", size: 100 }],
        rollType: RollTypes.DELTA_GREEN,
        target: 50,
        ...overrides.input,
      },
    },
    stash: {
      input: {
        gameId: "test-game-id",
        dice: [{ type: "d100", size: 100 }],
        rollType: RollTypes.DELTA_GREEN,
        target: 50,
        ...overrides.input,
      },
      playerId: "test-user-id",
      onBehalfOf: undefined,
      ...overrides.stash,
    },
    result: {
      data:
        overrides.result !== undefined
          ? { [tableName]: overrides.result }
          : { [tableName]: [mockPlayerSheet] },
    },
    error: null,
  } as unknown as Context;
};

describe("rollDice resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("request function", () => {
    it("should create correct DynamoDB BatchGetItem request", () => {
      const tableName = "Wildsea-" + environment.name;
      const mockContext = createMockContext();
      const result = request(mockContext);

      expect(result).toEqual({
        operation: "BatchGetItem",
        tables: {
          [tableName]: {
            keys: [
              {
                PK: "GAME#test-game-id",
                SK: "PLAYER#test-user-id",
              },
            ],
          },
        },
      });
    });

    it("should include ship key when onBehalfOf is provided", () => {
      const tableName = "Wildsea-" + environment.name;
      const contextWithOnBehalfOf = createMockContext({
        input: { onBehalfOf: "ship-id" },
      });

      const result = request(contextWithOnBehalfOf);

      expect(result).toEqual({
        operation: "BatchGetItem",
        tables: {
          [tableName]: {
            keys: [
              {
                PK: "GAME#test-game-id",
                SK: "PLAYER#test-user-id",
              },
              {
                PK: "GAME#test-game-id",
                SK: "PLAYER#ship-id",
              },
            ],
          },
        },
      });
    });

    it("should not add duplicate keys when onBehalfOf equals current user", () => {
      const tableName = "Wildsea-" + environment.name;
      const contextWithSelfOnBehalfOf = createMockContext({
        input: { onBehalfOf: "test-user-id" }, // Same as identity.sub
      });

      const result = request(contextWithSelfOnBehalfOf);

      expect(result).toEqual({
        operation: "BatchGetItem",
        tables: {
          [tableName]: {
            keys: [
              {
                PK: "GAME#test-game-id",
                SK: "PLAYER#test-user-id",
              },
            ],
          },
        },
      });
    });
  });

  describe("response function - Delta Green rolls", () => {
    it("should return CRITICAL_SUCCESS for roll of 01", () => {
      // Mock Math.random to return 0 (which becomes 1)
      jest.spyOn(Math, "random").mockReturnValue(0);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.CRITICAL_SUCCESS);
      expect(result.diceList[0].value).toBe(1);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return FUMBLE for roll of 00 (100)", () => {
      // Mock Math.random to return 0.99 (which becomes 100)
      jest.spyOn(Math, "random").mockReturnValue(0.99);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FUMBLE);
      expect(result.diceList[0].value).toBe(100);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return CRITICAL_SUCCESS for matching digits <= target", () => {
      // Mock Math.random to return 0.21 (which becomes 22, all digits same and <= 50)
      jest.spyOn(Math, "random").mockReturnValue(0.21);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.CRITICAL_SUCCESS);
      expect(result.diceList[0].value).toBe(22);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return FUMBLE for matching digits > target", () => {
      // Mock Math.random to return 0.65 (which becomes 66, all digits same and > 50)
      jest.spyOn(Math, "random").mockReturnValue(0.65);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FUMBLE);
      expect(result.diceList[0].value).toBe(66);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return SUCCESS for regular roll <= target", () => {
      // Mock Math.random to return 0.24 (which becomes 25, <= 50)
      jest.spyOn(Math, "random").mockReturnValue(0.24);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.SUCCESS);
      expect(result.diceList[0].value).toBe(25);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return FAILURE for regular roll > target", () => {
      // Mock Math.random to return 0.74 (which becomes 75, > 50)
      jest.spyOn(Math, "random").mockReturnValue(0.74);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FAILURE);
      expect(result.diceList[0].value).toBe(75);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return SUCCESS for roll exactly equal to target", () => {
      // Mock Math.random to return 0.49 (which becomes 50, exactly equal to target 50)
      jest.spyOn(Math, "random").mockReturnValue(0.49);

      const mockContext = createMockContext();
      const result = response(mockContext);

      expect(result.grade).toBe(Grades.SUCCESS);
      expect(result.diceList[0].value).toBe(50);
      expect(result.playerName).toBe("Test Character");
    });

    it("should return CRITICAL_SUCCESS for matching digits equal to target", () => {
      // Mock Math.random to return 0.32 (which becomes 33, matching digits and = target)
      jest.spyOn(Math, "random").mockReturnValue(0.32);

      const contextWithTarget33 = createMockContext({
        input: { target: 33 },
      });

      const result = response(contextWithTarget33);

      expect(result.grade).toBe(Grades.CRITICAL_SUCCESS);
      expect(result.diceList[0].value).toBe(33);
      expect(result.playerName).toBe("Test Character");
    });

    it("should handle onBehalfOf that equals current user (self-roll)", () => {
      const contextWithSelfOnBehalfOf = createMockContext({
        stash: {
          input: {
            gameId: "test-game-id",
            dice: [{ type: "d100", size: 100 }],
            rollType: RollTypes.DELTA_GREEN,
            target: 50,
          },
          playerId: "test-user-id",
          onBehalfOf: "test-user-id", // Same as identity.sub
        },
        result: [mockPlayerSheet], // Only the player sheet
      });

      jest.spyOn(Math, "random").mockReturnValue(0.24);

      const result = response(contextWithSelfOnBehalfOf);

      expect(result.grade).toBe(Grades.SUCCESS);
      expect(result.playerName).toBe("Test Character");
      expect(result.playerId).toBe("test-user-id");
      expect(result.rolledBy).toBe("Test Character");
      expect(result.proxyRoll).toBe(false); // Should be false for self-roll
    });
  });

  describe("response function - error cases", () => {
    it("should error when player not found in game (no onBehalfOf)", () => {
      const contextWithNoPlayer = createMockContext({
        result: [], // Empty result - no player found
      });

      expect(() => response(contextWithNoPlayer)).toThrow("Unauthorized");
    });
  });

  describe("response function - onBehalfOf ship rolls", () => {
    it("should return ship name when rolling on behalf of ship", () => {
      const contextWithShip = createMockContext({
        stash: {
          input: {
            gameId: "test-game-id",
            dice: [{ type: "d100", size: 100 }],
            rollType: RollTypes.DELTA_GREEN,
            target: 50,
          },
          playerId: "test-user-id",
          onBehalfOf: "ship-id",
        },
        result: [mockPlayerSheet, mockShipSheet],
      });

      jest.spyOn(Math, "random").mockReturnValue(0.24);

      const result = response(contextWithShip);

      expect(result.grade).toBe(Grades.SUCCESS);
      expect(result.playerName).toBe("Test Ship");
      expect(result.playerId).toBe("ship-id");
    });

    it("should error if onBehalfOf record is not a ship", () => {
      const mockNonShip = {
        userId: "non-ship-id",
        gameId: "test-game-id",
        characterName: "Not A Ship",
        type: "CHARACTER",
      };

      const contextWithNonShip = createMockContext({
        stash: {
          input: {
            gameId: "test-game-id",
            dice: [{ type: "d100", size: 100 }],
            rollType: RollTypes.DELTA_GREEN,
            target: 50,
          },
          playerId: "test-user-id",
          onBehalfOf: "non-ship-id",
        },
        result: [mockPlayerSheet, mockNonShip],
      });

      expect(() => response(contextWithNonShip)).toThrow("Unauthorized");
    });

    it("should error if onBehalfOf ID does not exist in game", () => {
      const contextWithMissingShip = createMockContext({
        stash: {
          input: {
            gameId: "test-game-id",
            dice: [{ type: "d100", size: 100 }],
            rollType: RollTypes.DELTA_GREEN,
            target: 50,
          },
          playerId: "test-user-id",
          onBehalfOf: "non-existent-id",
        },
        result: [mockPlayerSheet], // Only player, no ship
      });

      expect(() => response(contextWithMissingShip)).toThrow("Unauthorized");
    });
  });

  describe("response function - Sum rolls", () => {
    it("should return NEUTRAL for sum roll type", () => {
      const sumContext = createMockContext({
        input: {
          dice: [
            { type: "d6", size: 6 },
            { type: "d6", size: 6 },
          ],
          rollType: RollTypes.SUM,
          target: 7,
        },
      });

      // Mock Math.random to return consistent values
      jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);

      const result = response(sumContext);

      expect(result.grade).toBe(Grades.NEUTRAL);
      expect(result.value).toBe(8); // 4 + 4
      expect(result.playerName).toBe("Test Character");
    });
  });
});
