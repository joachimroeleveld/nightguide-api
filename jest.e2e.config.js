const BASE_CONFIG = require('./jest.config');

module.exports = {
  ...BASE_CONFIG,
  testRegex: 'src/.*\\.e2e.test\\.js$',
};
