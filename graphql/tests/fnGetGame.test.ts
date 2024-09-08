import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  request,
  response,
  makeCharacterSheetData,
  makeSheetSection,
  makeGameData,
} from "../function/fnGetGame/appsync";
import {
  TypeCharacter,
  TypeFirefly,
  TypeGame,
  TypeSection,
} from "../lib/constants";
import type {
  Data,
  DataGame,
  DataPlayerSheet,
  DataSheetSection,
} from "../lib/dataTypes";

describe("request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a DynamoDBQueryRequest when identity and id are present", () => {
    const context: Context<{ id: string }> = {
      arguments: { id: "test-id" },
      identity: { sub: "test-sub" } as AppSyncIdentityCognito,
    } as Context<{ id: string }>;

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
    const context: Context<{ id: string }> = {
      arguments: { id: "test-id" },
    } as Context<{ id: string }>;

    expect(() => request(context)).toThrow(
      "Unauthorized: Identity information is missing.",
    );
  });

  it("should throw an error when identity sub is missing", () => {
    const context: Context<{ id: string }> = {
      arguments: { id: "test-id" },
      identity: {} as AppSyncIdentityCognito,
    } as Context<{ id: string }>;

    expect(() => request(context)).toThrow("Unauthorized: User ID is missing.");
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
      { id: string },
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
      result: [],
    } as unknown as Context<
      { id: string },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Game not found");
  });

  it("should return a game object with playerSheets when data is valid", () => {
    const context = {
      identity: { sub: "notfirefly" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameDescription: "A test game",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            fireflyUserId: "user1",
            players: [],
            joinToken: "token",
            type: TypeGame,
          } as DataGame,
          {
            userId: "user1",
            gameId: "game1",
            characterName: "Character 1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeCharacter,
          } as DataPlayerSheet,
          {
            userId: "user1",
            gameId: "game1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeSection,
          } as DataSheetSection,
          {
            userId: "user2",
            gameId: "game1",
            characterName: "Character 2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeFirefly,
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { id: string },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    const result = response(context);

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameDescription: "A test game",
      playerSheets: [
        {
          userId: "user1",
          gameId: "game1",
          characterName: "Character 1",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeCharacter,
          sections: [
            {
              userId: "user1",
              gameId: "game1",
              createdAt: "2023-01-01",
              updatedAt: "2023-01-02",
              type: TypeSection,
            },
          ],
        },
        {
          userId: "user2",
          gameId: "game1",
          characterName: "Character 2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeFirefly,
          sections: [],
        },
      ],
      joinToken: null,
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
    });
  });

  it("should return a game object with playerSheets and joinToken when data is valid and user is firefly", () => {
    const context = {
      identity: { sub: "user1" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameDescription: "A test game",
            fireflyUserId: "user1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            players: [],
            joinToken: "token",
            type: TypeGame,
          } as DataGame,
          {
            userId: "user1",
            gameId: "game1",
            characterName: "Character 1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeCharacter,
          } as DataPlayerSheet,
          {
            userId: "user1",
            gameId: "game1",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeSection,
          } as DataSheetSection,
          {
            userId: "user2",
            gameId: "game1",
            characterName: "Character 2",
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeFirefly,
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { id: string },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    const result = response(context);

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameDescription: "A test game",
      playerSheets: [
        {
          userId: "user1",
          gameId: "game1",
          characterName: "Character 1",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeCharacter,
          sections: [
            {
              userId: "user1",
              gameId: "game1",
              createdAt: "2023-01-01",
              updatedAt: "2023-01-02",
              type: TypeSection,
            },
          ],
        },
        {
          userId: "user2",
          gameId: "game1",
          characterName: "Character 2",
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
          type: TypeFirefly,
          sections: [],
        },
      ],
      joinToken: "token",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
    });
  });

  it("should throw an error when game record is not found", () => {
    const context = {
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
          } as DataPlayerSheet,
        ],
      },
    } as unknown as Context<
      { id: string },
      Record<string, never>,
      undefined,
      undefined,
      { items: Data[] }
    >;

    expect(() => response(context)).toThrow("Game record not found");
  });

  it("should throw an error when an unknown type is encountered", () => {
    const context = {
      identity: { sub: "user1" } as AppSyncIdentityCognito,
      result: {
        items: [
          {
            gameId: "game1",
            gameName: "Test Game",
            gameDescription: "A test game",
            fireflyUserId: "user1",
            players: [],
            createdAt: "2023-01-01",
            updatedAt: "2023-01-02",
            type: TypeGame,
          } as DataGame,
          {
            type: "UNKNOWN_TYPE",
          } as unknown as Data,
        ],
      },
    } as unknown as Context<
      { id: string },
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
      gameDescription: "A test game",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      joinToken: "token",
      type: TypeGame,
      players: ["user3", "user2"],
      fireflyUserId: "user1",
    };

    const result = makeGameData(data, "notFirefly");

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameDescription: "A test game",
      joinToken: null,
      playerSheets: [],
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
    });
  });

  it("should create a Game object from DataGame and show the joinToken", () => {
    const data: DataGame = {
      gameId: "game1",
      gameName: "Test Game",
      gameDescription: "A test game",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      joinToken: "token",
      type: TypeGame,
      players: ["user3", "user2"],
      fireflyUserId: "user1",
    };

    const result = makeGameData(data, "user1");

    expect(result).toEqual({
      gameId: "game1",
      gameName: "Test Game",
      gameDescription: "A test game",
      playerSheets: [],
      joinToken: "token",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeGame,
    });
  });
});

describe("makeCharacterSheetData", () => {
  it("should create a PlayerSheet object from DataPlayerSheet", () => {
    const data: DataPlayerSheet = {
      userId: "user1",
      gameId: "game1",
      characterName: "Character 1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeCharacter,
      gameName: "Test Game",
      gameDescription: "A test game",
    };

    const result = makeCharacterSheetData(data);

    expect(result).toEqual({
      userId: "user1",
      gameId: "game1",
      characterName: "Character 1",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeCharacter,
      sections: [],
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
      createdAt: "2023-01-01",
      updatedAt: "2023-01-02",
      type: TypeSection,
    });
  });
});
