const dotenv = require('dotenv');
dotenv.load();

const mongoose = require('mongoose');

const sandbox = require('sinon').createSandbox();
const { mockAuth } = require('./authMock');

const { createExpressApp } = require('../../framework/expressServer');

beforeAll(cb => {
  // Use global sandbox for mocks that you want to persist across multiple test suites
  if (!global.sandbox) {
    global.sandbox = sandbox;
  }

  mockAuth();

  global.app = createExpressApp();

  mongoose
    .connect(
      process.env.MONGO_URI,
      { useNewUrlParser: true, dbName: 'main-test' }
    )
    .then(() => cb())
    .catch(err => cb(err));
});

afterAll(async () => {
  mongoose.connection.close();

  global.sandbox.restore();
});
