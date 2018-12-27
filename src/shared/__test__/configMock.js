const config = require('../config');

const mockedEnv = {
  ...process.env,
};

function mockKey(key, value, sandbox = global.sandbox) {
  mockedEnv[key] = value;
  sandbox.stub(config, 'get').callsFake(key => mockedEnv[key]);
}

module.exports = {
  mockKey,
};
