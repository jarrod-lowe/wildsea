import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);
jest.mock("../environment.json", () => ({
  name: "MOCK",
}));
jest.mock("../lib/joinCode", () => ({
  generateJoinCode: jest.fn(() => "7A8CV2"),
}));

import { request, response } from "../function/createGame/createGame";
import {
  util,
  Context,
  AppSyncIdentityCognito,
  Info,
} from "@aws-appsync/utils";

describe("request function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid DynamoDBTransactWriteItem when context is valid", () => {
    // Arrange
    const mockContext: Context<{
      input: {
        name: string;
        description?: string;
        gameType: string;
        language: string;
      };
    }> & {
      stash: {
        gameDefaults?: {
          defaultCharacterName: string;
          defaultGMName: string;
          defaultNPCs: { type: string; characterName: string }[];
          theme: string;
          remainingCharacters: number;
          remainingSections: number;
          remainingAssets: number;
        };
      };
    } = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      identity: {
        sub: "1234-5678-91011",
      } as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "createGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      } as Info,
      result: {},
      stash: {
        gameDefaults: {
          defaultCharacterName: "Test Character",
          defaultGMName: "Test GM",
          defaultNPCs: [
            {
              type: "NPC",
              characterName: "Test Ship",
            },
          ],
          theme: "wildsea",
          remainingCharacters: 20,
          remainingSections: 50,
          remainingAssets: 100,
        },
      },
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    const mockId = "unique-id";
    const mockTimestamp = "2024-08-17T00:00:00Z";
    const mockNPCId = "unique-npc-id";

    (util.autoId as jest.Mock)
      .mockReturnValueOnce(mockId)
      .mockReturnValueOnce(mockNPCId);
    (util.time.nowISO8601 as jest.Mock).mockReturnValue(mockTimestamp);

    // Act
    const result = request(mockContext);

    // Assert
    expect(result).toEqual({
      operation: "TransactWriteItems",
      transactItems: [
        {
          operation: "PutItem",
          key: {
            PK: { S: `GAME#${mockId}` },
            SK: { S: "GAME" },
          },
          table: "Wildsea-MOCK",
          attributeValues: {
            gameName: { S: "Test Game" },
            gameDescription: { S: "Test Description" },
            gameType: { S: "wildsea" },
            gameId: { S: mockId },
            GSI1PK: { S: "JOIN#7A8CV2" },
            gmUserId: { S: "1234-5678-91011" },
            joinCode: { S: "7A8CV2" },
            createdAt: { S: mockTimestamp },
            updatedAt: { S: mockTimestamp },
            type: { S: "GAME" },
            theme: { S: "wildsea" },
            remainingCharacters: { N: "18" },
            remainingSections: { N: "50" },
            remainingAssets: { N: "100" },
          },
        },
        {
          operation: "PutItem",
          key: {
            PK: { S: `GAME#${mockId}` },
            SK: { S: `PLAYER#1234-5678-91011` },
          },
          table: "Wildsea-MOCK",
          attributeValues: {
            userId: { S: "1234-5678-91011" },
            gameId: { S: mockId },
            gameName: { S: "Test Game" },
            gameType: { S: "wildsea" },
            gameDescription: { S: "Test Description" },
            gmUserId: { S: "1234-5678-91011" },
            GSI1PK: { S: "USER#1234-5678-91011" },
            createdAt: { S: mockTimestamp },
            updatedAt: { S: mockTimestamp },
            type: { S: "GM" },
            characterName: { S: "Test GM" },
            remainingSections: { N: "50" },
          },
        },
        {
          operation: "PutItem",
          key: {
            PK: { S: `GAME#${mockId}` },
            SK: { S: `PLAYER#${mockNPCId}` },
          },
          table: "Wildsea-MOCK",
          attributeValues: {
            userId: { S: mockNPCId },
            gameId: { S: mockId },
            gameName: { S: "Test Game" },
            gameType: { S: "wildsea" },
            gameDescription: { S: "Test Description" },
            gmUserId: { S: "1234-5678-91011" },
            createdAt: { S: mockTimestamp },
            updatedAt: { S: mockTimestamp },
            type: { S: "NPC" },
            characterName: { S: "Test Ship" },
            remainingSections: { N: "50" },
          },
        },
      ],
    });
  });

  it("should throw an error if context identity is missing", () => {
    // Arrange
    const mockContext: Context<{
      input: {
        name: string;
        description?: string;
        gameType: string;
        language: string;
      };
    }> & {
      stash: {
        gameDefaults?: {
          defaultCharacterName: string;
          defaultGMName: string;
          defaultNPCs: { type: string; characterName: string }[];
          theme: string;
          remainingCharacters: number;
          remainingSections: number;
          remainingAssets: number;
        };
      };
    } = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      identity: undefined,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "createGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      } as Info,
      result: {},
      stash: {
        gameDefaults: {
          defaultCharacterName: "Test Character",
          defaultGMName: "Test GM",
          defaultNPCs: [
            {
              type: "NPC",
              characterName: "Test Ship",
            },
          ],
          theme: "wildsea",
          remainingCharacters: 20,
          remainingSections: 50,
          remainingAssets: 100,
        },
      },
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act & Assert
    expect(() => request(mockContext)).toThrow("Unauthorized");
  });

  it("should throw an error if user ID is missing", () => {
    // Arrange
    const mockContext: Context<{
      input: {
        name: string;
        description?: string;
        gameType: string;
        language: string;
      };
    }> & {
      stash: {
        gameDefaults?: {
          defaultCharacterName: string;
          defaultGMName: string;
          defaultNPCs: { type: string; characterName: string }[];
          theme: string;
          remainingCharacters: number;
          remainingSections: number;
          remainingAssets: number;
        };
      };
    } = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
          gameType: "wildsea",
          language: "en",
        },
      },
      identity: {} as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "createGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      } as Info,
      result: {},
      stash: {
        gameDefaults: {
          defaultCharacterName: "Test Character",
          defaultGMName: "Test GM",
          defaultNPCs: [
            {
              type: "NPC",
              characterName: "Test Ship",
            },
          ],
          theme: "wildsea",
          remainingCharacters: 20,
          remainingSections: 50,
          remainingAssets: 100,
        },
      },
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act & Assert
    expect(() => request(mockContext)).toThrow("Unauthorized");
  });
});

describe("response function", () => {
  it("should return context result if no error is present", () => {
    // Arrange
    const mockContext: Context = {
      env: {},
      arguments: {},
      args: {},
      identity: {} as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "createGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      } as Info,
      result: {
        keys: [
          {
            PK: "testPK",
            SK: "testSK",
          },
          {
            PK: "testPK2",
            SK: "testSK2",
          },
        ],
      },
      stash: {
        record: {
          gameName: "testGameName",
          gameDescription: "testGameDescription",
          gameType: "wildsea",
          gameId: "testGameId",
          joinCode: "7A8CV2",
          gmUserId: "testGMUserId",
          createdAt: "testCreatedAt",
          updatedAt: "testUpdatedAt",
          type: "testType",
          theme: "wildsea",
          remainingCharacters: 18,
          remainingSections: 50,
          remainingAssets: 100,
        },
      },
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act
    const result = response(mockContext);

    // Assert
    expect(result).toEqual({
      gameName: "testGameName",
      gameDescription: "testGameDescription",
      gameType: "wildsea",
      gameId: "testGameId",
      joinCode: "7A8CV2",
      gmUserId: "testGMUserId",
      createdAt: "testCreatedAt",
      updatedAt: "testUpdatedAt",
      type: "testType",
      theme: "wildsea",
      remainingCharacters: 18,
      remainingSections: 50,
      remainingAssets: 100,
    });
  });
});
