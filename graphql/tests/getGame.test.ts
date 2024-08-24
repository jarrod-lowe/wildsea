import { awsAppsyncUtilsMock } from "./mocks";

jest.mock("@aws-appsync/utils", () => awsAppsyncUtilsMock);

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { request, response } from "../query/getGame/appsync";

describe("request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("should append error if context.result is null", () => {
    const context: Context = {
      identity: { sub: "test-sub" } as AppSyncIdentityCognito,
      result: null,
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

  it("should return context.result if the caller is one of the players", () => {
    const context: Context = {
      identity: { sub: "player-sub" } as AppSyncIdentityCognito,
      result: { fireflyUserId: "some-other-id", players: ["player-sub"] },
    } as Context;

    const result = response(context);

    expect(result).toEqual({
      fireflyUserId: "some-other-id",
      players: ["player-sub"],
    });
  });

  it("should append error if players are set but the caller is not a player or firefly", () => {
    const context: Context = {
      identity: { sub: "unauthorized-sub" } as AppSyncIdentityCognito,
      result: { fireflyUserId: "some-other-id", players: ["player-sub"] },
    } as Context;

    response(context);

    expect(util.appendError).toHaveBeenCalledWith(
      "Unauthorized: User does not have access to the game.",
    );
  });
});
