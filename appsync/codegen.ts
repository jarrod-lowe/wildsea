
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "../graphql/schema.graphql",
  generates: {
    "graphql.ts": {
      plugins: ["typescript"]
    }
  }
};

export default config;
