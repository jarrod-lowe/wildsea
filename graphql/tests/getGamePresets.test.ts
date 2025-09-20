// Mock the util import first
const mockUtil = {
  dynamodb: {
    toMapValues: jest.fn((obj) => obj),
  },
  error: jest.fn((message: string, type: string) => {
    throw new Error(`${type}: ${message}`);
  }),
};

jest.mock("@aws-appsync/utils", () => ({
  util: mockUtil,
}));

import { request, response } from "../query/getGamePresets/getGamePresets";
import type { Context } from "@aws-appsync/utils";
import type { GetGamePresetsInput } from "../../appsync/graphql";

describe("getGamePresets resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("request", () => {
    it("should create correct DynamoDB query request", () => {
      const input = {
        dataSetName: "deltagreen-weapons",
        language: "en",
      };

      const context = {
        arguments: { input },
      } as Partial<Context<{ input: GetGamePresetsInput }>> as Context<{
        input: GetGamePresetsInput;
      }>;

      const result = request(context);

      expect(result.operation).toBe("Query");
      expect(result.query.expression).toBe("#PK = :pk");
      expect(result.query.expressionNames).toEqual({ "#PK": "PK" });
      expect(mockUtil.dynamodb.toMapValues).toHaveBeenCalledWith({
        ":pk": "GAMEPRESETS#deltagreen-weapons#en",
      });
    });

    it("should handle different languages", () => {
      const input = {
        dataSetName: "deltagreen-weapons",
        language: "tlh",
      };

      const context = {
        arguments: { input },
      } as Partial<Context<{ input: GetGamePresetsInput }>> as Context<{
        input: GetGamePresetsInput;
      }>;

      request(context);

      expect(mockUtil.dynamodb.toMapValues).toHaveBeenCalledWith({
        ":pk": "GAMEPRESETS#deltagreen-weapons#tlh",
      });
    });
  });

  describe("response", () => {
    it("should transform DynamoDB items to GamePresetItem format", () => {
      const input = {
        dataSetName: "deltagreen-weapons",
        language: "en",
      };

      const mockItems = [
        {
          displayName: "Glock 17 (9mm pistol)",
          data: '{"name":"Glock 17","skillId":"Firearms 🔫"}',
          language: "en",
        },
        {
          displayName: "M4 Carbine (5.56mm rifle)",
          data: '{"name":"M4 Carbine","skillId":"Firearms 🔫"}',
          language: "en",
        },
      ];

      const context = {
        arguments: { input },
        result: { items: mockItems },
        error: undefined,
      } as Partial<Context<{ input: GetGamePresetsInput }>> as Context<{
        input: GetGamePresetsInput;
      }>;

      const result = response(context);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        displayName: "Glock 17 (9mm pistol)",
        data: '{"name":"Glock 17","skillId":"Firearms 🔫"}',
        language: "en",
      });
      expect(result[1]).toEqual({
        displayName: "M4 Carbine (5.56mm rifle)",
        data: '{"name":"M4 Carbine","skillId":"Firearms 🔫"}',
        language: "en",
      });
    });

    it("should return empty array when no items", () => {
      const input = {
        dataSetName: "deltagreen-weapons",
        language: "en",
      };

      const context = {
        arguments: { input },
        result: { items: [] },
        error: undefined,
      } as Partial<Context<{ input: GetGamePresetsInput }>> as Context<{
        input: GetGamePresetsInput;
      }>;

      const result = response(context);

      expect(result).toEqual([]);
    });

    it("should handle errors correctly", () => {
      const input = {
        dataSetName: "deltagreen-weapons",
        language: "en",
      };

      const mockError = {
        message: "DynamoDB error",
        type: "DynamoDbException",
      };

      const context = {
        arguments: { input },
        result: { items: [] },
        error: mockError,
      } as Partial<Context<{ input: GetGamePresetsInput }>> as Context<{
        input: GetGamePresetsInput;
      }>;

      expect(() => response(context)).toThrow();
      expect(mockUtil.error).toHaveBeenCalledWith(
        "DynamoDB error",
        "DynamoDbException",
      );
    });
  });
});
