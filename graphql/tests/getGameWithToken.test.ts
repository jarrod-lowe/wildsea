import { awsAppsyncUtilsMock } from "./mocks";
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import type { JoinGameInput } from "../../appsync/graphql";
import {
  request,
  response,
} from "../function/getGameWithToken/getGameWithToken";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

describe("joinGame request function", () => {
  it("should throw an error if context identity is missing", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
      operation: "Query",
      index: "GSI1",
      query: {
        expression: "GSI1PK = :gsi1pk",
        expressionValues: {
          ":gsi1pk": { S: "JOIN#ABC123" },
        },
      },
    });
  });
});

describe("joinGame response function", () => {
  it("should throw unauthorized if no game found with join code", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
        items: [],
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow("Unauthorized");
  });

  it("should abort with an error if context has an error", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user123",
          },
        ],
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
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user456",
            playerSheets: [{ userId: "user123" }],
          },
        ],
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

  it("should throw localized error in Klingon for own game", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "tlh",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "tlh",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user123",
            playerSheets: [],
          },
        ],
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow(
      "nugh DIch DIch DIlo'meH DIch DIch",
    );
    expect(util.error).toHaveBeenCalledWith(
      "nugh DIch DIch DIlo'meH DIch DIch",
      "Conflict",
    );
  });

  it("should throw localized error in Klingon for already player", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "tlh",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "tlh",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user456",
            playerSheets: [{ userId: "user123" }],
          },
        ],
      },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    expect(() => response(mockContext)).toThrow("DIch naQ DIch DIch");
    expect(util.error).toHaveBeenCalledWith("DIch naQ DIch DIch", "Conflict");
  });

  it("should fall back to English for unsupported language", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "fr", // French - not supported
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "fr",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user123",
            playerSheets: [],
          },
        ],
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

  it("should return the game data if no errors", () => {
    const mockContext: Context<{ input: JoinGameInput }> = {
      env: {},
      arguments: {
        input: {
          joinCode: "ABC123",
          language: "en",
        },
      },
      args: {
        input: {
          joinCode: "ABC123",
          language: "en",
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
        items: [
          {
            joinToken: "token123",
            gmUserId: "user456",
            players: [],
            gameId: "game123",
            gameName: "Test Game",
            gameDescription: "Test Description",
          },
        ],
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
      gmUserId: "user456",
      players: [],
      gameId: "game123",
      gameName: "Test Game",
      gameDescription: "Test Description",
    });
  });
});
