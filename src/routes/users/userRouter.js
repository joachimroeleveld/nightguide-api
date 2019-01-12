const { Router } = require('express');
const { CREATED } = require('http-status');

const config = require('../../shared/config');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const {
  createUser,
  login,
  loginFb,
  getUserById,
  verifyAccount,
  sendPasswordReset,
  resendVerificationToken,
  resetPassword,
} = require('./userRepository');
const { standardAuth } = require('../../shared/auth');
const { USER_ROLES } = require('../../shared/constants');
const { validator } = require('../../shared/openapi');
const {
  NotFoundError,
  TokenExpiredError,
  UnauthorizedError,
} = require('../../shared/errors');

const router = new Router();

router.post(
  '/',
  validator.validate('post', '/users'),
  asyncMiddleware(async (req, res) => {
    const user = await createUser({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthday: req.body.birthday,
      gender: req.body.gender,
    });

    res.status(CREATED).json(user.deserialize());
  })
);

router.get(
  '/:userId',
  standardAuth(),
  validator.validate('get', '/users/{userId}'),
  asyncMiddleware(async (req, res) => {
    if (
      !req.user.checkRole(USER_ROLES.ROLE_ADMIN) &&
      req.params.userId !== req.user._id
    ) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(req.params.userId);

    res.json(user.deserialize());
  })
);

router.post(
  '/login',
  validator.validate('post', '/users/login'),
  asyncMiddleware(async (req, res) => {
    const { token, user } = await login(req.body.email, req.body.password);

    res.json({
      token,
      user: user.deserialize(),
    });
  })
);

router.post(
  '/login-fb',
  validator.validate('post', '/users/login-fb'),
  asyncMiddleware(async (req, res) => {
    const { token, user } = await loginFb({
      exchangeToken: req.body.token,
      permissions: req.body.permissions,
      userId: req.body.userId,
    });

    res.json({
      token,
      user: user.deserialize(),
    });
  })
);

router.get(
  '/:userId/verify-account',
  validator.validate('get', '/users/{userId}/verify-account'),
  asyncMiddleware(async (req, res) => {
    const renderArgs = {
      expired: false,
      staticUrl: config.get('STATIC_URL'),
    };

    try {
      await verifyAccount(req.params.userId, req.query.token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        renderArgs.expired = true;
        renderArgs.resendTokenUrl = `${config.get('HOST')}/users/${
          req.params.userId
        }/resend-verification-token?token=${req.query.token}`;
      } else {
        throw e;
      }
    }

    res.render('pages/verify-account', renderArgs);
  })
);

router.post(
  '/:userId/resend-verification-token',
  validator.validate('post', '/users/{userId}/resend-verification-token'),
  asyncMiddleware(async (req, res) => {
    await resendVerificationToken(req.params.userId);

    res.json({ success: true });
  })
);

router.post(
  '/send-password-reset',
  validator.validate('post', '/users/send-password-reset'),
  asyncMiddleware(async (req, res) => {
    await sendPasswordReset(req.body.email);

    res.json({ success: true });
  })
);

router.get(
  '/:userId/reset-password',
  validator.validate('get', '/users/{userId}/reset-password'),
  asyncMiddleware(async (req, res) => {
    const user = await getUserById(req.params.userId, '+passwordResetToken');

    if (!user) {
      throw new NotFoundError();
    }

    const renderArgs = {
      resetUrl: `${config.get('HOST')}/users/${user._id}/reset-password?token=${
        user.passwordResetToken
      }`,
      staticUrl: config.get('STATIC_URL'),
    };

    res.render('pages/reset-password', renderArgs);
  })
);

router.post(
  '/:userId/reset-password',
  validator.validate('post', '/users/{userId}/reset-password'),
  asyncMiddleware(async (req, res) => {
    await resetPassword(req.params.userId, req.query.token, req.body.password);

    res.json({ success: true });
  })
);

module.exports = router;
