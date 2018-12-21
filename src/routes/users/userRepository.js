const jwt = require('jsonwebtoken');

const User = require('./userModel');
const {
  UnauthorizedError,
  NotFoundError,
  TokenExpiredError,
  PreconditionFailedError,
  ConflictError,
} = require('../../shared/errors');
const FacebookApi = require('../../shared/services/facebook');

exports.createUser = async (data, verified = false) => {
  const existingUser = await exports.getUserByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('email_exists');
  }

  const user = await User.create(data);

  if (verified) {
    user.verificationToken = null;
    await user.save();
  }

  return user;
};

exports.getUserById = async (id, select) => {
  const query = User.findById(id);

  if (select) {
    query.select(select);
  }

  return await query.exec();
};

exports.getUserByEmail = async (email, select) => {
  const query = User.findOne({ email });

  if (select) {
    query.select(select);
  }

  return await query.exec();
};

exports.verifyAccount = async (userId, token) => {
  const user = await exports.getUserById(userId, '+verificationToken');

  if (!user) {
    throw new NotFoundError();
  }

  if (user.verificationToken !== token) {
    throw new UnauthorizedError('invalid_token');
  }

  const expired = await verifyJwtExpiration(token);

  if (expired) {
    throw new TokenExpiredError('token_expired');
  }

  user.verificationToken = null;
  await user.save();
};

exports.login = async (email, password, extraTokenPayload = {}) => {
  const user = await exports.getUserByEmail(email, '+salt +password');

  if (!user) {
    throw new NotFoundError('user_not_found');
  }
  if (!!user.verificationToken) {
    throw new UnauthorizedError('user_not_verified');
  }

  const valid = await user.verifyPassword(password);

  if (!valid) {
    throw new UnauthorizedError('incorrect_credentials');
  }

  const token = user.signJwt();

  return {
    token,
    user,
  };
};

exports.loginFb = async ({ exchangeToken, permissions, userId }) => {
  const fbApi = new FacebookApi();
  const { accessToken, expiresIn } = await fbApi.getAccessToken(exchangeToken);
  const { email } = await fbApi.getMe(['email']);

  let user = await exports.getUserByEmail(email);

  if (!user) {
    // Create a user with the data from Facebook
    user = await exports.createUser(
      {
        email: email,
        facebook: {
          token: accessToken,
          tokenExpires: expiresIn,
          permissions,
          userId,
        },
      },
      true
    );
  }

  const token = user.signJwt();

  return {
    user,
    token,
  };
};

exports.resendVerificationToken = async userId => {
  const user = await exports.getUserById(userId, '+verificationToken');

  if (!user) {
    throw new NotFoundError();
  } else if (!user.verificationToken) {
    throw new PreconditionFailedError('account_already_validated');
  }

  user.verificationToken = user.signJwt({}, '1h');
  const userSave = user.save();

  const mail = user.sendVerificationEmail().catch(e => {
    console.error('Error sending verification email:', e.message);
    throw e;
  });

  return Promise.all([userSave, mail]);
};

exports.sendPasswordReset = async email => {
  const user = await exports.getUserByEmail(email, '+passwordResetToken');

  if (!user) {
    throw new NotFoundError();
  }

  user.passwordResetToken = user.signJwt({}, '1h');
  const userSave = user.save();

  const mail = user.sendPasswordResetEmail().catch(e => {
    console.error('Error sending password reset email:', e.message);
    throw e;
  });

  return Promise.all([userSave, mail]);
};

exports.resetPassword = async (userId, token, password) => {
  const user = await exports.getUserById(userId, '+passwordResetToken');

  if (!user) {
    throw new NotFoundError();
  }

  if (user.passwordResetToken !== token) {
    throw new UnauthorizedError('invalid_token');
  }

  const expired = await verifyJwtExpiration(user.passwordResetToken);

  if (expired) {
    throw new TokenExpiredError('expired_token');
  }

  user.password = password;
  user.passwordResetToken = null;
  await user.save();
};

function verifyJwtExpiration(token) {
  return new Promise(resolve => {
    jwt.verify(token, process.env.JWT_SECRET, err => {
      resolve(!!err);
    });
  });
}
