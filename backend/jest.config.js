module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*(*.)+(spec|test).+(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }]
  },
  // Mock isomorphic-dompurify for tests (ES module compatibility)
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/src/__tests__/__mocks__/isomorphic-dompurify.ts',
  },
  // Allow ES modules from isomorphic-dompurify and its dependencies
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|html-encoding-sniffer|@exodus|jsdom|whatwg-url|web-streams-polyfill|abort-controller|sax|xmlchars|data-urls|formdata-node|node-domexception|rrweb-cssom|cssstyle|parse5)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/types/**',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15
    }
  }
};