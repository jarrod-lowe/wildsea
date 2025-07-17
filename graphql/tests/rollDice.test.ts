import { request, response } from "../mutation/rollDice/rollDice";
import { Context } from "@aws-appsync/utils";
import { RollTypes, Grades } from "../lib/constants/rollTypes";

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

const mockGame = {
  gameId: "test-game-id",
  fireflyUserId: "test-user-id",
  players: ["test-user-id"],
};

const mockContext = {
  identity: {
    sub: "test-user-id",
  },
  arguments: {
    input: {
      gameId: "test-game-id",
      dice: [{ type: "d100", size: 100 }],
      rollType: RollTypes.DELTA_GREEN,
      target: 50,
    },
  },
  stash: {
    input: {
      gameId: "test-game-id",
      dice: [{ type: "d100", size: 100 }],
      rollType: RollTypes.DELTA_GREEN,
      target: 50,
    },
    playerId: "test-user-id",
  },
  result: mockGame,
  error: null,
} as unknown as Context;

describe("rollDice resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("request function", () => {
    it("should create correct DynamoDB request", () => {
      const result = request(mockContext);

      expect(result).toEqual({
        operation: "GetItem",
        key: {
          PK: "GAME#test-game-id",
          SK: "GAME",
        },
      });
    });
  });

  describe("response function - Delta Green rolls", () => {
    it("should return CRITICAL_SUCCESS for roll of 01", () => {
      // Mock Math.random to return 0 (which becomes 1)
      jest.spyOn(Math, "random").mockReturnValue(0);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.CRITICAL_SUCCESS);
      expect(result.diceList[0].value).toBe(1);
    });

    it("should return FUMBLE for roll of 00 (100)", () => {
      // Mock Math.random to return 0.99 (which becomes 100)
      jest.spyOn(Math, "random").mockReturnValue(0.99);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FUMBLE);
      expect(result.diceList[0].value).toBe(100);
    });

    it("should return CRITICAL_SUCCESS for matching digits <= target", () => {
      // Mock Math.random to return 0.21 (which becomes 22, all digits same and <= 50)
      jest.spyOn(Math, "random").mockReturnValue(0.21);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.CRITICAL_SUCCESS);
      expect(result.diceList[0].value).toBe(22);
    });

    it("should return FUMBLE for matching digits > target", () => {
      // Mock Math.random to return 0.65 (which becomes 66, all digits same and > 50)
      jest.spyOn(Math, "random").mockReturnValue(0.65);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FUMBLE);
      expect(result.diceList[0].value).toBe(66);
    });

    it("should return SUCCESS for regular roll <= target", () => {
      // Mock Math.random to return 0.24 (which becomes 25, <= 50)
      jest.spyOn(Math, "random").mockReturnValue(0.24);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.SUCCESS);
      expect(result.diceList[0].value).toBe(25);
    });

    it("should return FAILURE for regular roll > target", () => {
      // Mock Math.random to return 0.74 (which becomes 75, > 50)
      jest.spyOn(Math, "random").mockReturnValue(0.74);

      const result = response(mockContext);

      expect(result.grade).toBe(Grades.FAILURE);
      expect(result.diceList[0].value).toBe(75);
    });
  });

  describe("response function - Sum rolls", () => {
    it("should return NEUTRAL for sum roll type", () => {
      const sumContext = {
        ...mockContext,
        arguments: {
          input: {
            gameId: "test-game-id",
            dice: [
              { type: "d6", size: 6 },
              { type: "d6", size: 6 },
            ],
            rollType: RollTypes.SUM,
            target: 7,
          },
        },
        stash: {
          input: {
            gameId: "test-game-id",
            dice: [
              { type: "d6", size: 6 },
              { type: "d6", size: 6 },
            ],
            rollType: RollTypes.SUM,
            target: 7,
          },
          playerId: "test-user-id",
        },
      } as unknown as Context;

      // Mock Math.random to return consistent values
      jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);

      const result = response(sumContext);

      expect(result.grade).toBe(Grades.NEUTRAL);
      expect(result.value).toBe(8); // 4 + 4
    });
  });
});
