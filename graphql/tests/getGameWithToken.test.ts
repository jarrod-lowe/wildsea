import { awsAppsyncUtilsMock } from "./mocks";
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  request,
  response,
} from "../function/getGameWithToken/getGameWithToken";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

describe("joinGame request function", () => {
  it("should throw an error if context identity is missing", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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

    expect(() => request(mockContext)).toThrow("Unauthorized");
  });

  it("should throw an error if user ID is missing", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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

    expect(() => request(mockContext)).toThrow("Unauthorized");
  });

  it("should return a valid DynamoDBGetItemRequest when context is valid", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    const result = request(mockContext);

    expect(result).toEqual({
      operation: "GetItem",
      key: {
        PK: { S: "GAME#game123" },
        SK: { S: "GAME" },
      },
    });
  });
});

describe("joinGame response function", () => {
  it("should abort with an error if context has an error", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
    expect(util.error).toHaveBeenCalledWith("Some error", "SomeErrorType", {});
  });

  it("should throw an error if game not found or invalid token", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
      result: null,
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow("Unauthorized");
  });

  it("should throw an error if user is trying to join their own game", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
      result: {
        joinToken: "token123",
        fireflyUserId: "user123",
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow(
      "You cannot join your own game",
    );
    expect(util.error).toHaveBeenCalledWith(
      "You cannot join your own game",
      "Conflict",
    );
  });

  it("should throw an error if user is already a player in the game", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
      result: {
        joinToken: "token123",
        fireflyUserId: "user456",
        players: ["user123"],
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow(
      "You are already a player in this game",
    );
    expect(util.error).toHaveBeenCalledWith(
      "You are already a player in this game",
      "Conflict",
    );
  });

  it("should return the game data if no errors", () => {
    const mockContext: Context<{
      input: { gameId: string; joinToken: string };
    }> = {
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
      result: {
        joinToken: "token123",
        fireflyUserId: "user456",
        players: [],
        gameId: "game123",
        gameName: "Test Game",
        gameDescription: "Test Description",
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    const result = response(mockContext);

    expect(result).toEqual({
      joinToken: "token123",
      fireflyUserId: "user456",
      players: [],
      gameId: "game123",
      gameName: "Test Game",
      gameDescription: "Test Description",
    });
  });
});
