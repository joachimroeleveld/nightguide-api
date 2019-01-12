const dotenv = require('dotenv');
dotenv.load();

const sgMail = require('@sendgrid/mail');
const mongoose = require('mongoose');
const config = require('../config');

const sandbox = require('sinon').createSandbox();
const { mockAuth } = require('./authMock');
const configMock = require('./configMock');

const { createExpressApp } = require('../../framework/expressServer');

beforeAll(cb => {
  // Use global sandbox for mocks that you want to persist across multiple test suites
  if (!global.sandbox) {
    global.sandbox = sandbox;
  }

  mockAuth();

  configMock.mockKey('HOST', 'http://localhost:8080');

  // Mock SendGrid
  sandbox.stub(sgMail, 'send').resolves();

  global.app = createExpressApp();

  mongoose
    .connect(
      config.get('MONGO_URI'),
      { useNewUrlParser: true, dbName: 'main-test' }
    )
    .then(() => cb())
    .catch(err => cb(err));
});

afterAll(async () => {
  mongoose.connection.close();

  global.sandbox.restore();
});
