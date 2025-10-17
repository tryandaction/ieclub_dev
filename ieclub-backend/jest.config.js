// Jest配置文件

module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/index.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  testTimeout: 10000,
};