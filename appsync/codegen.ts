
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "../graphql/schema.graphql",
  generates: {
    "graphql.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          AWSTime: "string",
          AWSDateTime: "string",
          AWSTimestamp: "string",
          AWSEmail: "string",
          AWSJSON: "string",
          AWSURL: "string",
          AWSPhone: "string",
          AWSIPAddress: "string",
        }
      }
    }
  }
};

export default config;
