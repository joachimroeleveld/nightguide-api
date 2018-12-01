const BASE_CONFIG = require('./jest.config');

module.exports = {
  ...BASE_CONFIG,
  testRegex: 'src/.*\\.test\\.js$',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/src/shared/__test__'],
  coverageThreshold: {
    global: {},
  },
};
