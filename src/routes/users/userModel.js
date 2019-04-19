const util = require('util');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;

const mail = require('../../shared/services/mail');
const config = require('../../shared/config');
const { deserialize } = require('./lib/serialization');

const JWT_SECRET = config.get('JWT_SECRET');

const { USER_ROLES, USER_GENDER_TYPES } = require('../../shared/constants');

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    birthday: Date,
    gender: {
      type: String,
      enum: Object.values(USER_GENDER_TYPES),
    },
    email: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    role: {
      type: String,
      default: USER_ROLES.ROLE_STANDARD,
      enum: Object.values(USER_ROLES),
    },
    password: {
      type: String,
      select: false,
    },
    facebook: {
      type: {
        token: {
          type: String,
          select: false,
        },
        tokenExpires: Date,
        permissions: Array,
        userId: String,
      },
      default: null,
    },
    salt: {
      type: String,
      select: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.method('verifyPassword', async function(password) {
  let user = this;

  if (!user.salt || !user.password) {
    user = await this.model('User')
      .findById(this._id)
      .select('salt password')
      .exec();
  }

  return user.password === (await hashPassword(password, user.salt));
});

UserSchema.pre('save', async function(cb) {
  const user = this;

  // Only hash the password if it has been modified (or is new)
  if (user.isModified('password')) {
    user.salt = await generateToken(128);
    user.password = await hashPassword(user.password, user.salt);
  }

  cb();
});

UserSchema.method('signJwt', function(extraTokenPayload = {}, expires = '1h') {
  const user = this;

  const opts = {};
  if (expires) {
    opts.expiresIn = expires;
  }

  return jwt.sign({ sub: user._id, ...extraTokenPayload }, JWT_SECRET, opts);
});

UserSchema.method('checkRole', function(roles) {
  const user = this;

  if (roles && !Array.isArray(roles)) roles = [roles];

  return roles.includes(user.role);
});

// TODO: move to repository
UserSchema.method('sendPasswordResetEmail', async function() {
  const user = this;

  if (!user.passwordResetToken) {
    throw new Error('no_reset_token');
  }

  const resetUrl = `${config.get('HOST')}/users/${
    user._id
  }/reset-password?token=${user.passwordResetToken}`;

  await mail.sendBasicEmail(
    user.email,
    `Reset your password`,
    `
You can reset your password by following <a href="${resetUrl}" target="_blank">this link</a>.<br/>
<br/>
<a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `
  );
});

// TODO: move to repository
UserSchema.method('sendVerificationEmail', async function() {
  const user = this;

  if (!user.verificationToken) {
    throw new Error('no_verification_token');
  }

  const verifyUrl = `${config.get('HOST')}/users/${
    user._id
  }/verify-account?token=${user.verificationToken}`;

  return mail.sendBasicEmail(
    user.email,
    `Verify your account`,
    `
You can verify your account by following <a href="${verifyUrl}" target="_blank">this link</a>. After you verified your account, you can login and start using your account.<br/>
<br/>
<a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
    `
  );
});

UserSchema.method('deserialize', function() {
  return deserialize(this);
});

UserSchema.static('hashPassword', hashPassword);

async function hashPassword(password, salt) {
  const hash = await util.promisify(crypto.pbkdf2)(
    password,
    salt,
    100000,
    64,
    'sha512'
  );

  return hash.toString('hex');
}

async function generateToken(length = 32) {
  const token = await util.promisify(crypto.randomBytes)(length);
  return token.toString('hex');
}

module.exports = mongoose.model('User', UserSchema);
