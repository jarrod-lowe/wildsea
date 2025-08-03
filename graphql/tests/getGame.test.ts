import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  request,
  response,
  makeCharacterSheetData,
  makeSheetSection,
  makeGameData,
} from "../function/getGame/getGame";
import {
  TypeCharacter,
  TypeGM,
  TypeGame,
  TypeSection,
} from "../lib/constants/entityTypes";
import type {
  Data,
  DataGame,
  DataPlayerSheet,
  DataSheetSection,
} from "../lib/dataTypes";
import { GetGameInput } from "../../appsync/graphql";

describe("request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a DynamoDBQueryRequest when identity and id are present", () => {
    const context = {
      arguments: { input: { gameId: "test-id" } },
      identity: { sub: "test-sub" } as AppSyncIdentityCognito,
    } as unknown as Context<{ input: GetGameInput }>;

    const result = request(context);

    expect(result).toEqual({
      operation: "Query",
      query: {
        expression: "#pk = :pk",
        expressionNames: {
          "#pk": "PK",
        },
        expressionValues: {
          ":pk": { S: "GAME#test-id" },
        },
      },
    });
  });

  it("should throw an error when identity is missing", () => {
    const context = {
      arguments: { input: { gameId: "test-id" } },
    } as unknown as Context<{ input: GetGameInput }>;

    expect(() => request(context)).toThrow("Unauthorized");
  });

  it("should throw an error when identity sub is missing", () => {
    const context: Context<{ input: GetGameInput }> = {
      arguments: { id: "test-id" },
      identity: {} as AppSyncIdentityCognito,
    } as unknown as Context<{ input: GetGameInput }>;

    expect(() => request(context)).toThrow("Unauthorized");
  });
});

describe("response", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if context.error is present", () => {
    const context = {
      error: { message: "Some error", type: "SomeType" },
      result: [],
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Some error");
    expect(util.error).toHaveBeenCalledWith("Some error", "SomeType", []);
  });

  it("should throw an error if no results are found", () => {
    const context = {
      arguments: {
        input: {
          gameId: "game1",
          language: "en",
        },
      },
      result: [],
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Game not found");
  });

  it("should return a game object with playerSheets when data is valid", () => {
    const context = {
      arguments: {
        input: {
          gameId: "game1",
          language: "en",
        },
      },
      identity: { sub: "notGM" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameType: "wildsea",
            gameDescription: "A test game",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            gmUserId: "user2",
            players: [],
            joinCode: "ABC123",
            type: TypeGame,
            remainingCharacters: 20,
            remainingSections: 50,
          } as DataGame,
          {
            userId: "user1",
            gameId: "game1",
            characterName: "Character 1",
            gmUserId: "user2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeCharacter,
            remainingSections: 50,
          } as DataPlayerSheet,
          {
            userId: "user1",
            gameId: "game1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            position: 0,
            type: TypeSection,
            content: "content",
            sectionId: "sectionId",
            sectionName: "sectionName",
            sectionType: "sectionType",
          } as DataSheetSection,
          {
            userId: "user2",
            gameId: "game1",
            characterName: "Character 2",
            gmUserId: "user2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeGM,
            remainingSections: 50,
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    const result = response(context);

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      playerSheets: [
        {
          userId: "user1",
          gameId: "game1",
          characterName: "Character 1",
          gmUserId: "user2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeCharacter,
          remainingSections: 50,
          sections: [
            {
              userId: "user1",
              gameId: "game1",
              createdAt: "2023-01-01",
              updatedAt: "2023-01-02",
              position: 0,
              type: TypeSection,
              content: "content",
              sectionId: "sectionId",
              sectionName: "sectionName",
              sectionType: "sectionType",
            },
          ],
        },
        {
          userId: "user2",
          gameId: "game1",
          characterName: "Character 2",
          gmUserId: "user2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeGM,
          remainingSections: 50,
          sections: [],
        },
      ],
      gmUserId: "user2",
      joinCode: null,
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
      remainingCharacters: 20,
      remainingSections: 50,
      theme: undefined,
    });
  });

  it("should return a game object with playerSheets and joinToken when data is valid and user is GM", () => {
    const context = {
      arguments: {
        input: {
          gameId: "game1",
          language: "en",
        },
      },
      identity: { sub: "user2" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameType: "wildsea",
            gameDescription: "A test game",
            gmUserId: "user2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            players: [],
            joinCode: "ABC123",
            type: TypeGame,
            remainingCharacters: 20,
            remainingSections: 50,
          } as DataGame,
          {
            userId: "user1",
            gameId: "game1",
            characterName: "Character 1",
            gmUserId: "user2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeCharacter,
            remainingSections: 50,
          } as DataPlayerSheet,
          {
            userId: "user1",
            gameId: "game1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            position: 0,
            type: TypeSection,
            content: "content",
            sectionId: "sectionId",
            sectionName: "sectionName",
            sectionType: "sectionType",
          } as DataSheetSection,
          {
            userId: "user2",
            gameId: "game1",
            characterName: "Character 2",
            gmUserId: "user2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeGM,
            remainingSections: 50,
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    const result = response(context);

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      playerSheets: [
        {
          userId: "user1",
          gameId: "game1",
          characterName: "Character 1",
          gmUserId: "user2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeCharacter,
          remainingSections: 50,
          sections: [
            {
              userId: "user1",
              gameId: "game1",
              content: "content",
              sectionId: "sectionId",
              sectionName: "sectionName",
              sectionType: "sectionType",
              createdAt: "2023-01-01",
              updatedAt: "2023-01-02",
              position: 0,
              type: TypeSection,
            },
          ],
        },
        {
          userId: "user2",
          gameId: "game1",
          characterName: "Character 2",
          gmUserId: "user2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeGM,
          remainingSections: 50,
          sections: [],
        },
      ],
      gmUserId: "user2",
      joinCode: "ABC123",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
      remainingCharacters: 20,
      remainingSections: 50,
      theme: undefined,
    });
  });

  it("should throw an error when game record is not found", () => {
    const context = {
      arguments: {
        input: {
          gameId: "game1",
          language: "en",
        },
      },
      identity: { sub: "user1" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            userId: "user1",
            gameId: "game1",
            characterName: "Character 1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeCharacter,
            remainingSections: 50,
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Game record not found");
  });

  it("should throw an error when an unknown type is encountered", () => {
    const context = {
      arguments: {
        input: {
          gameId: "game1",
          language: "en",
        },
      },
      identity: { sub: "user1" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameType: "wildsea",
            gameDescription: "A test game",
            gmUserId: "user1",
            players: [],
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeGame,
            remainingCharacters: 20,
            remainingSections: 50,
          } as DataGame,
          {
            type: "UNKNOWN_TYPE",
          } as unknown as Data,
        ],
      },
    } as unknown as Context<
      { input: GetGameInput },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Unknown type: UNKNOWN_TYPE");
  });
});

describe("makeGameData", () => {
  it("should create a Game object from DataGame", () => {
    const data: DataGame = {
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      joinCode: "ABC123",
      type: TypeGame,
      players: ["user3", "user2"],
      gmUserId: "user1",
      remainingCharacters: 20,
      remainingSections: 50,
    };

    const result = makeGameData(data, "notGM");

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      joinCode: null,
      playerSheets: [],
      gmUserId: "user1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
      remainingCharacters: 20,
      remainingSections: 50,
      theme: undefined,
    });
  });

  it("should create a Game object from DataGame and show the joinToken", () => {
    const data: DataGame = {
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      joinCode: "ABC123",
      type: TypeGame,
      players: ["user3", "user2"],
      gmUserId: "user1",
      remainingCharacters: 20,
      remainingSections: 50,
    };

    const result = makeGameData(data, "user1");

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameType: "wildsea",
      gameDescription: "A test game",
      playerSheets: [],
      gmUserId: "user1",
      joinCode: "ABC123",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
      remainingCharacters: 20,
      remainingSections: 50,
      theme: undefined,
    });
  });
});

describe("makeCharacterSheetData", () => {
  it("should create a PlayerSheet object from DataPlayerSheet", () => {
    const data: DataPlayerSheet = {
      userId: "user1",
      gameId: "game1",
      gameType: "wildsea",
      characterName: "Character 1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      gmUserId: "XXXXX",
      type: TypeCharacter,
      gameName: "Test Game",
      gameDescription: "A test game",
      remainingSections: 50,
    };

    const result = makeCharacterSheetData(data);

    expect(result).toEqual({
      userId: "user1",
      gameId: "game1",
      characterName: "Character 1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      gmUserId: "XXXXX",
      type: TypeCharacter,
      sections: [],
      remainingSections: 50,
    });
  });
});

describe("makeSheetSection", () => {
  it("should create a SheetSection object from DataSheetSection", () => {
    const data: DataSheetSection = {
      userId: "user1",
      gameId: "game1",
      sectionId: "XXXXXX",
      sectionName: "Section 1",
      sectionType: "type1",
      content: "{}",
      position: 0,
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeSection,
    };

    const result = makeSheetSection(data);

    expect(result).toEqual({
      userId: "user1",
      gameId: "game1",
      sectionId: "XXXXXX",
      sectionName: "Section 1",
      sectionType: "type1",
      content: "{}",
      position: 0,
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeSection,
    });
  });
});
