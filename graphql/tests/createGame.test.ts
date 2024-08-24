import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import { request, response } from "../mutation/createGame/appsync";
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

  it("should return a valid DynamoDBPutItemRequest when context is valid", () => {
    // Arrange
    const mockContext: Context<{
      input: { name: string; description?: string };
    }> = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
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
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    const mockId = "unique-id";
    const mockTimestamp = "2024-08-17T00:00:00Z";

    (util.autoId as jest.Mock).mockReturnValue(mockId);
    (util.time.nowISO8601 as jest.Mock).mockReturnValue(mockTimestamp);

    // Act
    const result = request(mockContext);

    // Assert
    expect(result).toEqual({
      operation: "PutItem",
      key: {
        PK: { S: `GAME#${mockId}` },
        SK: { S: "GAME" },
      },
      attributeValues: {
        name: { S: "Test Game" },
        description: { S: "Test Description" },
        id: { S: mockId },
        fireflyUserId: { S: "1234-5678-91011" },
        createdAt: { S: mockTimestamp },
        updatedAt: { S: mockTimestamp },
      },
    });
  });

  it("should throw an error if context identity is missing", () => {
    // Arrange
    const mockContext: Context<{
      input: { name: string; description?: string };
    }> = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
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
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act & Assert
    expect(() => request(mockContext)).toThrow(
      "Unauthorized: Identity information is missing.",
    );
  });

  it("should throw an error if user ID is missing", () => {
    // Arrange
    const mockContext: Context<{
      input: { name: string; description?: string };
    }> = {
      env: {},
      arguments: {
        input: {
          name: "Test Game",
          description: "Test Description",
        },
      },
      args: {
        input: {
          name: "Test Game",
          description: "Test Description",
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
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act & Assert
    expect(() => request(mockContext)).toThrow(
      "Unauthorized: User ID is missing.",
    );
  });
});

describe("response function", () => {
  it("should append an error if context has an error", () => {
    // Arrange
    const mockContext: Context = {
      env: {},
      arguments: {},
      args: {},
      identity: {} as AppSyncIdentityCognito,
      source: undefined,
      error: {
        message: "Some error",
        type: "SomeErrorType",
      },
      info: {
        fieldName: "createGame",
        parentTypeName: "Mutation",
        variables: {},
        selectionSetList: [],
        selectionSetGraphQL: "",
      } as Info,
      result: {},
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act
    response(mockContext);

    // Assert
    expect(util.appendError).toHaveBeenCalledWith(
      "Some error",
      "SomeErrorType",
      {},
    );
  });

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
      result: { someKey: "someValue" },
      stash: {},
      prev: undefined,
      request: {
        headers: {},
        domainName: null,
      },
    };

    // Act
    const result = response(mockContext);

    // Assert
    expect(result).toEqual({ someKey: "someValue" });
  });
});
