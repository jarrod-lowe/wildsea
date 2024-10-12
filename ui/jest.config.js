module.exports = {
  preset: 'ts-jest',
  rootDir: ".",
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  globals: {
    "process.env.NODE_ENV": "test"
  },
  moduleNameMapper: {
    'react-markdown': '<rootDir>/mocks/react-markdown.tsx',
    '\\.css$': '<rootDir>/mocks/style.js',
    '@uiw/react-md-editor': '<rootDir>/mocks/react-md-editor.tsx'
  },
};
