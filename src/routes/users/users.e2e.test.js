require('../../shared/__test__/testBootstrap');

const addSeconds = require('date-fns/add_seconds');
const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const FacebookApi = require('../../shared/services/facebook');
const userRepository = require('./userRepository');
const User = require('./userModel');
const {
  TEST_USER_1,
  TEST_USER_2,
  TEST_USER_FACEBOOK_1,
} = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const mailService = require('../../shared/services/mail');
const {
  mockUserAuth,
  restoreUserAuth,
} = require('../../shared/__test__/authMock');

const sandbox = sinon.createSandbox();
const USER_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

describe('users e2e', () => {
  afterEach(async () => {
    sandbox.restore();
    await clearDb();
  });

  describe('POST /users', () => {
    const validateResponse = validator.validateResponse('post', '/users');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      expect(res.status).toEqual(201);
      expect(res.body).toMatchSnapshot(USER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('updates the user if another authentication method was used before', async () => {
      await userRepository.createUser(TEST_USER_FACEBOOK_1, true);

      const res = await request(global.app)
        .post('/users')
        .send({
          ...TEST_USER_1,
          email: TEST_USER_FACEBOOK_1.email,
        });

      expect(res.status).toEqual(201);
      expect(res.body).toMatchSnapshot(USER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should set a verification token on the user', async () => {
      await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      const user = (await userRepository.getUserByEmail(
        TEST_USER_1.email,
        '+verificationToken'
      )).toObject();

      expect(user.verificationToken).toBeTruthy();
    });

    it('should send a verification email', async () => {
      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      expect(mailService.sendBasicEmail.called).toBe(true);
    });

    it('should send a 409 if the user email already exists', async () => {
      await userRepository.createUser(TEST_USER_1, true);

      const res = await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      expect(res.status).toEqual(409);
    });
  });

  describe('GET /users/{userId}', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/users/{userId}'
    );

    it('happy path', async () => {
      const user = await userRepository.createUser(TEST_USER_1, true);

      const res = await request(global.app).get(`/users/${user._id}`);

      expect(res.status).toEqual(200);
      expect(res.body).toMatchInlineSnapshot(
        USER_SNAPSHOT_MATCHER,

        `
Object {
  "__v": 0,
  "birthday": "1995-10-04",
  "createdAt": Any<String>,
  "email": "alice@rogers.nl",
  "firstName": "Alice",
  "gender": "female",
  "id": Any<String>,
  "lastName": "Rogers",
  "updatedAt": Any<String>,
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('only admins can request other users', async () => {
      restoreUserAuth();

      const user1 = await userRepository.createUser(TEST_USER_1);
      const user2 = await userRepository.createUser(TEST_USER_2);

      const res = await request(global.app)
        .get(`/users/${user2._id}`)
        .set('Authorization', 'Bearer ' + user1.signJwt());

      expect(res.status).toEqual(401);
      expect(validateResponse(res)).toBeUndefined();

      mockUserAuth();
    });
  });

  describe('POST /users/login', () => {
    const validateResponse = validator.validateResponse('post', '/users/login');

    it('happy path', async () => {
      await userRepository.createUser(TEST_USER_1, true);

      const res = await request(global.app)
        .post('/users/login')
        .send({
          email: TEST_USER_1.email,
          password: TEST_USER_1.password,
        });

      expect(res.status).toEqual(200);
      expect(res.body.user).toMatchSnapshot(USER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns 404 when user is not found', async () => {
      const res = await request(global.app)
        .post('/users/login')
        .send({
          email: 'foo@bar.nl',
          password: 'pass',
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(404);
    });

    it('returns 401 when passing wrong password', async () => {
      await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app)
        .post('/users/login')
        .send({
          email: TEST_USER_1.email,
          password: 'bar',
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
    });

    it('returns 412 when account was created with different authentication method', async () => {
      await userRepository.createUser(TEST_USER_FACEBOOK_1);

      const res = await request(global.app)
        .post('/users/login')
        .send({
          email: TEST_USER_FACEBOOK_1.email,
          password: 'dummypass',
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(412);
    });

    it('returns 401 when the account is not verified', async () => {
      await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app)
        .post('/users/login')
        .send({
          email: TEST_USER_1.email,
          password: TEST_USER_1.password,
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
    });
  });

  describe('POST /users/login-fb', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/users/login-fb'
    );

    const email = 'nonexistent@user.com';
    const tokenExpires = addSeconds(new Date(), '3600');
    const permissions = ['public_profile'];
    const dummyAccessToken = 'dummyAccessToken';
    const dummyExchangeToken = 'dummyAccessToken';
    const fbUserId = '12345';
    const dummyPayload = {
      token: dummyExchangeToken,
      permissions: permissions,
      userId: fbUserId,
    };

    it('happy path', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      sandbox.stub(FacebookApi.prototype, 'getAccessToken').resolves({});
      sandbox.stub(FacebookApi.prototype, 'getMe').resolves({
        email: user.email,
      });

      const res = await request(global.app)
        .post('/users/login-fb')
        .send(dummyPayload);

      expect(res.status).toEqual(200);
      expect(res.body.user).toMatchSnapshot(USER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('adds facebook data if a different authentication method was used before', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      sandbox.stub(FacebookApi.prototype, 'getAccessToken').resolves({
        accessToken: dummyExchangeToken,
      });
      sandbox.stub(FacebookApi.prototype, 'getMe').resolves({
        email: user.email,
      });

      const res = await request(global.app)
        .post('/users/login-fb')
        .send(dummyPayload);

      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();

      const userWithFacebook = await userRepository.getUserById(user._id);
      expect(userWithFacebook.facebook.token).toEqual(dummyExchangeToken);
    });

    it('creates a user if no user exists for the email address', async () => {
      sandbox.stub(FacebookApi.prototype, 'getAccessToken').resolves({
        accessToken: dummyAccessToken,
        expiresIn: tokenExpires,
      });
      sandbox.stub(FacebookApi.prototype, 'getMe').resolves({
        email: 'nonexistent@user.com',
      });

      const res = await request(global.app)
        .post('/users/login-fb')
        .send(dummyPayload);

      const user = (await userRepository.getUserByEmail(
        email,
        '+facebook.token +password'
      )).toObject();

      expect(user.email).toEqual(email);
      expect(user.password).toBeUndefined();
      expect(user.facebook.tokenExpires.getTime()).toEqual(
        tokenExpires.getTime()
      );
      expect(user.facebook).toMatchObject({
        token: dummyAccessToken,
        permissions: permissions,
        userId: fbUserId,
        tokenExpires: expect.any(Date),
      });
      expect(res.status).toEqual(200);
      expect(res.body.isNew).toBe(true);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns 401 when the access token request fails', async () => {
      sandbox.stub(FacebookApi.prototype, '_apiRequest').throws();

      const res = await request(global.app)
        .post('/users/login-fb')
        .send(dummyPayload);

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
    });
  });

  describe('GET /users/:userId/verify-account', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/users/{userId}/verify-account'
    );

    it('happy path', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app).get(
        `/users/${user._id}/verify-account?token=${user.verificationToken}`
      );

      const updatedUser = (await userRepository.getUserById(
        user._id,
        '+verificationToken'
      )).toObject();

      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
      expect(res.text).toMatchSnapshot();
      expect(updatedUser.verificationToken).toBeNull();
    });

    it('shows a message when the token is expired', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      // Expire verification token
      user.verificationToken = user.signJwt({}, '0s');
      await user.save();

      const res = await request(global.app).get(
        `/users/${user._id}/verify-account?token=${user.verificationToken}`
      );

      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
      expect(res.text).toEqual(expect.stringMatching('The token has expired'));
    });

    it('shows a message when the token is invalid', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app).get(
        `/users/${user._id}/verify-account?token=invalid-token`
      );

      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
      expect(res.text).toEqual(expect.stringMatching('The link is incorrect'));
    });
  });

  describe('POST /users/:userId/resend-verification-token', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/users/{userId}/resend-verification-token'
    );

    it('happy path', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      sandbox.stub(user, 'signJwt').returns('testtoken');
      sandbox.stub(userRepository, 'getUserById').resolves(user);

      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      const res = await request(global.app).post(
        `/users/${user._id}/resend-verification-token?token=${
          user.verificationToken
        }`
      );

      expect(res.status).toEqual(200);
      expect(mailService.sendBasicEmail.getCall(0).args).toMatchSnapshot();
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /users/send-password-reset', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/users/send-password-reset'
    );

    it('happy path', async () => {
      const user = new User(TEST_USER_1);

      sandbox.stub(user, 'signJwt').returns('testtoken');
      sandbox.stub(userRepository, 'getUserByEmail').resolves(user);

      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      const res = await request(global.app)
        .post(`/users/send-password-reset`)
        .send({
          email: user.email,
        });

      expect(res.status).toEqual(200);
      expect(mailService.sendBasicEmail.getCall(0).args).toMatchSnapshot();
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /users/:userId/reset-password', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/users/{userId}/reset-password'
    );

    it('happy path', async () => {
      const user = await userRepository.createUser({
        ...TEST_USER_1,
        password: 'test-password',
        passwordResetToken: 'testtoken',
      });

      const res = await request(global.app).get(
        `/users/${user._id}/reset-password?token=testtoken`
      );

      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
      expect(res.text).toMatchSnapshot();
    });
  });

  describe('POST /users/:userId/reset-password', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/users/{userId}/reset-password'
    );

    it('happy path', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      user.passwordResetToken = user.signJwt({}, '1h');
      await user.save();

      const NEW_PASSWORD = 'new-password';

      const res = await request(global.app)
        .post(
          `/users/${user._id}/reset-password?token=${user.passwordResetToken}`
        )
        .send({
          password: NEW_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(validateResponse(res)).toBeUndefined();

      const updatedUser = await userRepository.getUserById(user._id);
      expect(await updatedUser.verifyPassword(NEW_PASSWORD)).toBe(true);
    });

    it('returns 401 when the token is expired', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      // Expire verification token
      user.passwordResetToken = user.signJwt({}, '0s');
      await user.save();

      const res = await request(global.app)
        .post(
          `/users/${user._id}/reset-password?token=${user.passwordResetToken}`
        )
        .send({
          password: 'foo',
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
    });

    it('returns 401 when token is invalid', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app)
        .post(`/users/${user._id}/reset-password?token=invalid-token`)
        .send({
          password: 'foo',
        });

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
    });
  });
});
