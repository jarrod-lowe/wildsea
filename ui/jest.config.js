module.exports = {
  rootDir: ".",
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    "/node_modules/(?!uuid)/"
  ],
  globals: {
    "process.env.NODE_ENV": "test"
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'react-markdown': '<rootDir>/mocks/react-markdown.tsx',
    '\\.css$': '<rootDir>/mocks/style.js',
    '@uiw/react-md-editor': '<rootDir>/mocks/react-md-editor.tsx'
  },
};
