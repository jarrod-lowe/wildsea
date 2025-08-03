import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import {
  request as getUserSettingsRequest,
  response as getUserSettingsResponse,
} from "../query/getUserSettings/getUserSettings";
import {
  request as updateUserSettingsRequest,
  response as updateUserSettingsResponse,
} from "../mutation/updateUserSettings/updateUserSettings";
import {
  util,
  Context,
  AppSyncIdentityCognito,
  Info,
} from "@aws-appsync/utils";

describe("getUserSettings", () => {
  describe("request function", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return a valid GetItem request when context is valid", () => {
      // Arrange
      const mockContext: Context = {
        env: {},
        arguments: {},
        args: {},
        identity: {
          sub: "1234-5678-91011",
        } as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "getUserSettings",
          parentTypeName: "Query",
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
      const result = getUserSettingsRequest(mockContext);

      // Assert
      expect(result).toEqual({
        operation: "GetItem",
        key: {
          PK: { S: "SETTINGS#1234-5678-91011" },
          SK: { S: "SETTINGS#" },
        },
      });
    });

    it("should throw an error if context identity is missing", () => {
      // Arrange
      const mockContext: Context = {
        env: {},
        arguments: {},
        args: {},
        identity: undefined,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "getUserSettings",
          parentTypeName: "Query",
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
      expect(() => getUserSettingsRequest(mockContext)).toThrow("Unauthorized");
    });

    it("should throw an error if user ID is missing", () => {
      // Arrange
      const mockContext: Context = {
        env: {},
        arguments: {},
        args: {},
        identity: {} as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "getUserSettings",
          parentTypeName: "Query",
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
      expect(() => getUserSettingsRequest(mockContext)).toThrow("Unauthorized");
    });
  });

  describe("response function", () => {
    it("should return context result if no error is present", () => {
      // Arrange
      const mockResult = {
        userId: "1234-5678-91011",
        settings: { theme: "dark", language: "en" },
        type: "SETTINGS",
        createdAt: "2024-08-17T00:00:00Z",
        updatedAt: "2024-08-17T00:00:00Z",
      };

      const mockContext: Context = {
        env: {},
        arguments: {},
        args: {},
        identity: {} as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "getUserSettings",
          parentTypeName: "Query",
          variables: {},
          selectionSetList: [],
          selectionSetGraphQL: "",
        } as Info,
        result: mockResult,
        stash: {},
        prev: undefined,
        request: {
          headers: {},
          domainName: null,
        },
      };

      // Act
      const result = getUserSettingsResponse(mockContext);

      // Assert
      expect(result).toEqual(mockResult);
    });
  });
});

describe("updateUserSettings", () => {
  describe("request function", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return a valid PutItem request when context is valid", () => {
      // Arrange
      const mockSettings = { theme: "dark", language: "en" };
      const mockContext: Context<{
        input: { settings: string; language: string };
      }> = {
        env: {},
        arguments: {
          input: {
            settings: JSON.stringify(mockSettings),
            language: "en",
          },
        },
        args: {
          input: {
            settings: JSON.stringify(mockSettings),
            language: "en",
          },
        },
        identity: {
          sub: "1234-5678-91011",
        } as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "updateUserSettings",
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

      const mockTimestamp = "2024-08-17T00:00:00Z";
      (util.time.nowISO8601 as jest.Mock).mockReturnValue(mockTimestamp);

      // Act
      const result = updateUserSettingsRequest(mockContext);

      // Assert
      expect(result).toEqual({
        operation: "PutItem",
        key: {
          PK: { S: "SETTINGS#1234-5678-91011" },
          SK: { S: "SETTINGS#" },
        },
        attributeValues: {
          userId: { S: "1234-5678-91011" },
          settings: { S: JSON.stringify(mockSettings) },
          type: { S: "SETTINGS" },
          createdAt: { S: mockTimestamp },
          updatedAt: { S: mockTimestamp },
        },
      });
    });

    it("should throw an error if settings exceed size limit", () => {
      // Arrange
      const largeSettings = { data: "x".repeat(2000) }; // Exceeds 1KiB limit
      const largeSettingsString = JSON.stringify(largeSettings);
      const mockContext: Context<{
        input: { settings: string; language: string };
      }> = {
        env: {},
        arguments: {
          input: {
            settings: largeSettingsString,
            language: "en",
          },
        },
        args: {
          input: {
            settings: largeSettingsString,
            language: "en",
          },
        },
        identity: {
          sub: "1234-5678-91011",
        } as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "updateUserSettings",
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
      expect(() => updateUserSettingsRequest(mockContext)).toThrow(
        "Settings exceed size limit: 2011 bytes",
      );
    });

    it("should throw an error if context identity is missing", () => {
      // Arrange
      const mockContext: Context<{
        input: { settings: string; language: string };
      }> = {
        env: {},
        arguments: {
          input: {
            settings: JSON.stringify({ theme: "dark" }),
            language: "en",
          },
        },
        args: {
          input: {
            settings: JSON.stringify({ theme: "dark" }),
            language: "en",
          },
        },
        identity: undefined,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "updateUserSettings",
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
      expect(() => updateUserSettingsRequest(mockContext)).toThrow(
        "Unauthorized",
      );
    });

    it("should throw an error if user ID is missing", () => {
      // Arrange
      const mockContext: Context<{
        input: { settings: string; language: string };
      }> = {
        env: {},
        arguments: {
          input: {
            settings: JSON.stringify({ theme: "dark" }),
            language: "en",
          },
        },
        args: {
          input: {
            settings: JSON.stringify({ theme: "dark" }),
            language: "en",
          },
        },
        identity: {} as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "updateUserSettings",
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
      expect(() => updateUserSettingsRequest(mockContext)).toThrow(
        "Unauthorized",
      );
    });
  });

  describe("response function", () => {
    it("should return context result if no error is present", () => {
      // Arrange
      const mockResult = {
        userId: "1234-5678-91011",
        settings: { theme: "dark", language: "en" },
        type: "SETTINGS",
        createdAt: "2024-08-17T00:00:00Z",
        updatedAt: "2024-08-17T00:00:00Z",
      };

      const mockContext: Context = {
        env: {},
        arguments: {},
        args: {},
        identity: {} as AppSyncIdentityCognito,
        source: undefined,
        error: undefined,
        info: {
          fieldName: "updateUserSettings",
          parentTypeName: "Mutation",
          variables: {},
          selectionSetList: [],
          selectionSetGraphQL: "",
        } as Info,
        result: mockResult,
        stash: {},
        prev: undefined,
        request: {
          headers: {},
          domainName: null,
        },
      };

      // Act
      const result = updateUserSettingsResponse(mockContext);

      // Assert
      expect(result).toEqual(mockResult);
    });
  });
});
