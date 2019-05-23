require('../shared/__test__/testBootstrap');

const sinon = require('sinon');

const { jwtAuth, setClientId, checkRole } = require('./middleware');
const User = require('../routes/users/userModel');
const { TEST_USER_1 } = require('../shared/__test__/fixtures');
const { UnauthorizedError } = require('../shared/errors');
const { USER_ROLES } = require('../shared/constants');

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

    it(`doesn't return an error when required=false`, () => {
      const req = {};
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      jwtAuth(false)(req, res, next);
    });
  });

  describe('checkRole', () => {
    it('happy path', async () => {
      const user = new User(TEST_USER_1);

      const req = {
        user,
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      checkRole(USER_ROLES.ROLE_STANDARD)(req, res, next);
    });

    it('rejects an invalid role', async () => {
      const user = new User(TEST_USER_1);

      const req = {};
      const res = {};
      const next = err => {
        expect(err).toBeInstanceOf(UnauthorizedError);
      };

      checkRole('godmode')(req, res, next);
    });
  });

  describe('setClientId', () => {
    it('sets the website client id if the correct API key is present', () => {
      const req = {
        headers: {
          'x-api-key': 'nyfuUiZg9D@G^CFX^LtB',
        },
      };
      const res = {};
      const next = err => {
        expect(err).toBeUndefined();
      };

      setClientId()(req, res, next);

      expect(req.clientId).toBe('website');
    });
  });
});
