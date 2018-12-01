require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const validator = require('../../shared/validator');
const userRepository = require('./userRepository');
const User = require('./userModel');
const { TEST_USER_1, TEST_USER_2 } = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const mailService = require('../../shared/services/mail');
const { mockAuth, restoreAuth } = require('../../shared/__test__/authMock');

const sandbox = sinon.createSandbox();

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
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.email).toEqual(TEST_USER_1.email);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should set a verification token on the user', async () => {
      await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      const user = await userRepository.getUserByEmail(
        TEST_USER_1.email,
        '+verificationToken'
      );

      expect(user.verificationToken).toBeTruthy();
    });

    it('should send a verification email', async () => {
      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      await request(global.app)
        .post('/users')
        .send(TEST_USER_1);

      expect(mailService.sendBasicEmail.called).toBe(true);
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
        {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        `
Object {
  "createdAt": Any<String>,
  "email": "foo@bar.nl",
  "id": "5c001cac8e84e1067f34695c",
  "updatedAt": Any<String>,
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('only admins can request other users', async () => {
      restoreAuth();

      const user1 = await userRepository.createUser(TEST_USER_1);
      const user2 = await userRepository.createUser(TEST_USER_2);

      const res = await request(global.app)
        .get(`/users/${user2._id}`)
        .set('Authorization', 'Bearer ' + user1.signJwt());

      expect(res.status).toEqual(401);
      expect(validateResponse(res)).toBeUndefined();

      mockAuth();
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
      expect(res.body.user).toMatchInlineSnapshot(
        {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        `
Object {
  "createdAt": Any<String>,
  "email": "foo@bar.nl",
  "id": "5c001cac8e84e1067f34695c",
  "updatedAt": Any<String>,
}
`
      );
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

      const updatedUser = await userRepository.getUserById(
        user._id,
        '+verificationToken'
      );

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

    it('returns 401 when token is invalid', async () => {
      const user = await userRepository.createUser(TEST_USER_1);

      const res = await request(global.app).get(
        `/users/${user._id}/verify-account?token=invalid-token`
      );

      expect(validateResponse(res)).toBeUndefined();
      expect(res.status).toEqual(401);
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

  describe('POST /users/:userId/send-password-reset', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/users/{userId}/send-password-reset'
    );

    it('happy path', async () => {
      const user = new User(TEST_USER_1);

      sandbox.stub(user, 'signJwt').returns('testtoken');
      sandbox.stub(userRepository, 'getUserById').resolves(user);

      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      const res = await request(global.app).post(
        `/users/${user._id}/send-password-reset`
      );

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
