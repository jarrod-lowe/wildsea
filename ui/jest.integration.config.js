module.exports = {
  rootDir: ".",
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(aws-amplify|@aws-amplify|uuid)/)"
  ],
  testMatch: ['**/tests/amplifyConfig.test.ts'],
  globals: {
    "process.env.NODE_ENV": "test"
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/mocks/style.js'
  }
};
