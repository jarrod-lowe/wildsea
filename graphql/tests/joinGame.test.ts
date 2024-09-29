import { awsAppsyncUtilsMock } from "./mocks";
import { request, response } from "../function/joinGame/joinGame";
import { Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { JoinGameInput } from "../../appsync/graphql";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);
jest.mock("../environment.json", () => ({
  name: "MOCK",
}));

describe("fnJoinGame request function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if context identity is missing", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      args: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      identity: undefined,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "joinGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      },
      result: {},
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => request(mockContext)).toThrow(
      "Unauthorized: Identity information is missing.",
    );
  });

  it("should throw an error if user ID is missing", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      args: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      identity: {} as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "joinGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      },
      result: {},
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => request(mockContext)).toThrow(
      "Unauthorized: User ID is missing.",
    );
  });

  it("should return a valid TransactWriteItems request when context is valid", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      args: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      identity: {
        sub: "user123",
      } as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "joinGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      },
      result: {},
      stash: {},
      prev: {
        result: {
          gameName: "Test Game",
          gameDescription: "Test Description",
          fireflyUserId: "firefly",
        },
      },
      request: {
        headers: {},
        domainName: null,
      },
    };

    const mockTimestamp = "2024-08-17T00:00:00Z";
    (awsAppsyncUtilsMock.util.time.nowISO8601 as jest.Mock).mockReturnValue(
      mockTimestamp,
    );

    const result = request(mockContext);

    expect(result).toEqual({
      operation: "TransactWriteItems",
      transactItems: [
        {
          operation: "UpdateItem",
          table: "Wildsea-MOCK",
          key: {
            PK: { S: "GAME#game123" },
            SK: { S: "GAME" },
          },
          update: {
            expression: "ADD #players :player SET #updatedAt = :updatedAt",
            expressionNames: {
              "#players": "players",
              "#updatedAt": "updatedAt",
            },
            expressionValues: {
              ":player": { SS: ["user123"] },
              ":updatedAt": { S: mockTimestamp },
            },
          },
        },
        {
          operation: "PutItem",
          table: "Wildsea-MOCK",
          key: {
            PK: { S: "GAME#game123" },
            SK: { S: "PLAYER#user123" },
          },
          attributeValues: {
            gameId: { S: "game123" },
            userId: { S: "user123" },
            GSI1PK: { S: "USER#user123" },
            gameName: { S: "Test Game" },
            gameDescription: { S: "Test Description" },
            characterName: { S: "Unnamed Character" },
            fireflyUserId: { S: "firefly" },
            type: { S: "CHARACTER" },
            createdAt: { S: mockTimestamp },
            updatedAt: { S: mockTimestamp },
          },
        },
      ],
    });
  });
});

describe("fnJoinGame response function", () => {
  it("should abort with an error if context has an error", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      args: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      identity: {
        sub: "user123",
      } as AppSyncIdentityCognito,
      source: undefined,
      error: {
        message: "Some error",
        type: "SomeErrorType",
      },
      info: {
        fieldName: "joinGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      },
      result: {},
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow("Some error");
  });

  it("should return the game data with joinToken set to null", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      args: {
        input: {
          gameId: "game123",
          joinToken: "token123",
        },
      },
      identity: {
        sub: "user123",
      } as AppSyncIdentityCognito,
      source: undefined,
      error: undefined,
      info: {
        fieldName: "joinGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      },
      result: {},
      stash: {},
      prev: {
        result: {
          joinToken: "token123",
          fireflyUserId: "user456",
          players: [],
          gameId: "game123",
          gameName: "Test Game",
          gameDescription: "Test Description",
        },
      },
      request: {
        headers: {},
        domainName: null,
      },
    };

    const result = response(mockContext);

    expect(result).toEqual({
      joinToken: null,
      fireflyUserId: "user456",
      playerSheets: [],
      players: [],
      gameId: "game123",
      gameName: "Test Game",
      gameDescription: "Test Description",
    });
  });
});
