require('../shared/__test__/testBootstrap');

const sinon = require('sinon');

const authMock = require('../shared/__test__/authMock');
const configMock = require('../shared/__test__/configMock');
const { jwtAuth, authenticateAppClient, setClientId } = require('./middleware');
const User = require('../routes/users/userModel');
const { TEST_USER_1 } = require('../shared/__test__/fixtures');
const { UnauthorizedError } = require('../shared/errors');
const { CLIENT_IDS } = require('../shared/constants');

const sandbox = sinon.sandbox.create();

describe('middleware', () => {
  afterEach(function() {
    sandbox.restore();
  });

  describe('jwtAuth', () => {
    it('happy path', async () => {
      const user = new User(TEST_USER_1);
      user._id = '123';

      sandbox.stub(User, 'findById').resolves(user);

      const req = {
        token: user.signJwt(),
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
        expect(req.user._id).toEqual(user._id);
      };

      jwtAuth()(req, res, next);
    });

    it('rejects an invalid token', async () => {
      const req = {
        token: 'invalid_token',
      };
      const res = {};
      const next = err => {
        expect(err).toBeInstanceOf(UnauthorizedError);
      };

      jwtAuth()(req, res, next);
    });

    it('rejects an expired token', async () => {
      const user = new User(TEST_USER_1);

      const req = {
        token: user.signJwt({}, 0), // Expired token
      };
      const res = {};
      const next = err => {
        expect(err).toBeInstanceOf(UnauthorizedError);
      };

      jwtAuth()(req, res, next);
    });

    it('rejects an invalid role', async () => {
      const user = new User(TEST_USER_1);

      const req = {
        token: user.signJwt(),
      };
      const res = {};
      const next = err => {
        expect(err).toBeInstanceOf(UnauthorizedError);
      };

      jwtAuth('godmode')(req, res, next);
    });
  });

  describe('setClientId', () => {
    it('sets the CLIENT_APP id if the App-Token header is present', () => {
      authMock.restoreAppClientAuth();
      configMock.mockKey('MOBILE_APP_TOKEN', 'testToken');

      const req = {
        headers: {
          'app-token': 'testToken',
        },
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      setClientId()(req, res, next);

      expect(req.clientId).toBe(CLIENT_IDS.CLIENT_APP);

      configMock.restoreKey('MOBILE_APP_TOKEN');
      authMock.mockAppClientAuth();
    });
  });

  describe('authenticateAppClient', () => {
    it('happy path', async () => {
      const req = {
        clientId: CLIENT_IDS.CLIENT_APP,
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      authenticateAppClient()(req, res, next);
    });

    it('returns UnauthorizedError if client is not app', () => {
      const req = {
        clientId: null,
      };
      const res = {};
      const next = err => {
        expect(err).toBeInstanceOf(UnauthorizedError);
      };

      authenticateAppClient()(req, res, next);
    });

    it('skips checks for admin users', () => {
      const user = new User(TEST_USER_1);
      user.checkRole = sandbox.stub().returns(true);

      const req = { user };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      authenticateAppClient()(req, res, next);
    });
  });
});
