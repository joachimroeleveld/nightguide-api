require('../shared/__test__/testBootstrap');

const sinon = require('sinon');

const configMock = require('../shared/__test__/configMock');
const { jwtAuth, authenticateAppClient } = require('./middleware');
const User = require('../routes/users/userModel');
const { TEST_USER_1 } = require('../shared/__test__/fixtures');
const { UnauthorizedError } = require('../shared/errors');
const { API_CLIENTS } = require('../shared/constants');

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

  describe('authenticateAppClient', () => {
    it('happy path', async () => {
      configMock.mockKey('MOBILE_APP_TOKEN', 'testToken');

      const req = {
        locals: {},
        headers: {
          'App-Token': 'testToken',
        },
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      authenticateAppClient()(req, res, next);

      expect(req.client).toBe(API_CLIENTS.CLIENT_APP);

      configMock.restoreKey('MOBILE_APP_TOKEN');
    });

    it('returns UnauthorizedError if header is invalid', () => {
      const req = {
        headers: {
          'App-Token': 'invalid-token',
        },
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
