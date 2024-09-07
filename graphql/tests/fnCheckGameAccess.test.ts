import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import {
  request,
  response,
  permitted,
} from "../function/fnCheckGameAccess/appsync";
import type { DataGame } from "../lib/dataTypes";

describe("request", () => {
  it("should return a DynamoDBGetItemRequest when identity and id are present", () => {
    const context: Context<{ id: string }> = {
      arguments: { id: "test-id" },
      identity: { sub: "test-sub" } as AppSyncIdentityCognito,
    } as Context<{ id: string }>;

    const result = request(context);

    expect(result).toEqual({
      operation: "GetItem",
      key: {
        PK: { S: "GAME#test-id" },
        SK: { S: "GAME" },
      },
    });
  });

  it("should throw an error when identity is missing", () => {
    const context: Context<{ id: string }> = {
      arguments: { id: "test-id" },
      identity: null,
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
  it("should append error if context.error is present", () => {
    const context: Context = {
      error: { message: "Some error", type: "SomeType" },
      result: {},
    } as Context;

    response(context);

    expect(util.appendError).toHaveBeenCalledWith("Some error", "SomeType", {});
  });

  it("should append error if identity sub is missing", () => {
    const context: Context = {
      identity: {} as AppSyncIdentityCognito,
      result: {},
    } as Context;

    response(context);

    expect(util.appendError).toHaveBeenCalledWith(
      "Unauthorized: User ID is missing.",
    );
  });

  it("should append error if user does not have access", () => {
    const context: Context = {
      identity: { sub: "unauthorized-sub" } as AppSyncIdentityCognito,
      result: { fireflyUserId: "some-other-id", players: [] },
    } as Context;

    response(context);

    expect(util.appendError).toHaveBeenCalledWith(
      "Unauthorized: User does not have access to the game.",
    );
  });

  it("should return context.result if user has access", () => {
    const context: Context = {
      identity: { sub: "authorized-sub" } as AppSyncIdentityCognito,
      result: { fireflyUserId: "authorized-sub", players: [] },
    } as Context;

    const result = response(context);

    expect(result).toEqual({ fireflyUserId: "authorized-sub", players: [] });
  });
});

describe("permitted", () => {
  const baseGameData: DataGame = {
    gameId: "game-1",
    gameName: "Test Game",
    gameDescription: "A test game",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    type: "GAME",
    fireflyUserId: "firefly-sub",
    players: [],
  };

  it("should return false if data is null", () => {
    const identity = { sub: "test-sub" } as AppSyncIdentityCognito;
    const data = null as unknown as DataGame;

    expect(permitted(identity, data)).toBe(false);
  });

  it("should return true if user is firefly", () => {
    const identity = { sub: "firefly-sub" } as AppSyncIdentityCognito;
    const data: DataGame = { ...baseGameData, fireflyUserId: "firefly-sub" };

    expect(permitted(identity, data)).toBe(true);
  });

  it("should return true if user is a player", () => {
    const identity = { sub: "player-sub" } as AppSyncIdentityCognito;
    const data: DataGame = {
      ...baseGameData,
      fireflyUserId: "firefly-sub",
      players: ["player-sub"],
    };

    expect(permitted(identity, data)).toBe(true);
  });

  it("should return false if user is neither firefly nor a player", () => {
    const identity = { sub: "unauthorized-sub" } as AppSyncIdentityCognito;
    const data: DataGame = {
      ...baseGameData,
      fireflyUserId: "firefly-sub",
      players: ["player-sub"],
    };

    expect(permitted(identity, data)).toBe(false);
  });

  it("should return false if players array is empty", () => {
    const identity = { sub: "unauthorized-sub" } as AppSyncIdentityCognito;
    const data: DataGame = {
      ...baseGameData,
      fireflyUserId: "firefly-sub",
      players: [],
    };

    expect(permitted(identity, data)).toBe(false);
  });
});
