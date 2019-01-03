const jwt = require('jsonwebtoken');

const config = require('../../shared/config');
const User = require('./userModel');
const {
  UnauthorizedError,
  NotFoundError,
  TokenExpiredError,
  PreconditionFailedError,
  ConflictError,
} = require('../../shared/errors');
const FacebookApi = require('../../shared/services/facebook');

exports.createUser = async (data, setVerified = false) => {
  const existingUser = await exports.getUserByEmail(data.email, '+password');
  if (existingUser && !!existingUser.password) {
    throw new ConflictError('email_exists');
  }

  let user;
  if (!existingUser) {
    user = await User.create(data);
    // If user has been authenticated through other methods before
  } else if (!existingUser.password) {
    Object.assign(existingUser, data);
    user = await existingUser.save();
  }

  if (!setVerified) {
    user.verificationToken = user.signJwt({}, '1h');
    await user.save();
    await user.sendVerificationEmail().catch(e => {
      console.error('Error sending verification mail:', e.message);
    });
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

exports.updateUser = async (query, update, options = {}) => {
  const select = typeof query === 'string' ? { _id: query } : query;
  const defaultedOptions = {
    new: true,
    ...options,
  };

  return await User.findOneAndUpdate(select, update, defaultedOptions).exec();
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
  const user = await exports.getUserByEmail(
    email,
    '+salt +password +verificationToken'
  );

  if (!user) {
    throw new NotFoundError('user_not_found');
  }
  if (!user.password) {
    throw new PreconditionFailedError('invalid_auth_type');
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
  const userFbData = {
    token: accessToken,
    tokenExpires: expiresIn,
    permissions,
    userId,
  };

  let user = await exports.getUserByEmail(email);

  if (!user) {
    // Create a user with the data from Facebook
    user = await exports.createUser(
      {
        email: email,
        facebook: userFbData,
      },
      true
    );
  } else if (!user.facebook) {
    user = await exports.updateUser(user._id, {
      $set: { facebook: userFbData },
    });
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
    jwt.verify(token, config.get('JWT_SECRET'), err => {
      resolve(!!err);
    });
  });
}
