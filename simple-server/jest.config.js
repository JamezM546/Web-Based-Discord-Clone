module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/lambda-package/'],
  testTimeout: 15000,
  collectCoverageFrom: [
    'services/userService.js',
    'models/User.js',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    './services/userService.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './models/User.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
