// Mock specific functions in the util object
const utilDynamo = jest.requireActual("@aws-sdk/util-dynamodb");
const mockMarshall = utilDynamo.marshall;
export const awsAppsyncUtilsMock = {
  util: {
    autoId: jest.fn(),
    time: {
      nowISO8601: jest.fn(),
    },
    error: jest.fn().mockImplementation((message: unknown) => {
      throw new Error(message as string);
    }),
    unauthorized: jest.fn().mockImplementation(() => {
      throw new Error("Unauthorized");
    }),
    appendError: jest.fn(),
    dynamodb: {
      toMapValues: jest.fn((val) => mockMarshall(val)),
      toString: jest.fn((val) => ({ S: val })),
    },
  },
};
