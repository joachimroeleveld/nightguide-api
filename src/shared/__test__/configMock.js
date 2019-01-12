const config = require('../config');

const originalEnv = { ...process.env };

const mockedEnv = {
  ...process.env,
};

function mockConfig(sandbox = global.sandbox) {
  sandbox.stub(config, 'get').callsFake(key => mockedEnv[key]);
}

function mockKey(key, value) {
  mockedEnv[key] = value;
}

function restoreKey(key) {
  mockedEnv[key] = originalEnv[key];
}

module.exports = {
  mockConfig,
  mockKey,
  restoreKey,
};
