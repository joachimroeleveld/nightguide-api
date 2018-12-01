const { Router } = require('express');
const { CREATED } = require('http-status');

const { asyncMiddleware } = require('../../shared/util/expressUtils');
const {
  createUser,
  login,
  getUserById,
  verifyAccount,
  sendPasswordReset,
  resendVerificationToken,
  resetPassword,
} = require('./userRepository');
const { standardAuth } = require('../../shared/auth');
const { USER_ROLES } = require('../../shared/constants');
const validator = require('../../shared/validator');
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
    const user = await createUser(req.body);

    res.status(CREATED).json(user.sanitize());
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

    res.json(user.sanitize());
  })
);

router.post(
  '/login',
  validator.validate('post', '/users/login'),
  asyncMiddleware(async (req, res) => {
    const { token, user } = await login(req.body.email, req.body.password);

    res.json({
      token,
      user: user.sanitize(),
    });
  })
);

router.get(
  '/:userId/verify-account',
  validator.validate('get', '/users/{userId}/verify-account'),
  asyncMiddleware(async (req, res) => {
    const renderArgs = {
      expired: false,
    };

    try {
      await verifyAccount(req.params.userId, req.query.token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        renderArgs.expired = true;
        renderArgs.resendTokenUrl = `${process.env.HOST}/users/${
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
  '/:userId/send-password-reset',
  validator.validate('post', '/users/{userId}/send-password-reset'),
  asyncMiddleware(async (req, res) => {
    await sendPasswordReset(req.params.userId);

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
      resetUrl: `${process.env.HOST}/users/${user._id}/reset-password?token=${
        user.passwordResetToken
      }`,
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
