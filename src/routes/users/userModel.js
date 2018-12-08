const util = require('util');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;

const JWT_SECRET = process.env.JWT_SECRET;

const mail = require('../../shared/services/mail');
const { USER_ROLES } = require('../../shared/constants');

const UserSchema = new Schema(
  {
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
      token: {
        type: String,
        select: false,
      },
      tokenExpires: Date,
      permissions: Array,
      userId: String,
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

  if (user.isNew && !!user.password) {
    user.verificationToken = user.signJwt({}, '1h');
    await user.sendVerificationEmail().catch(e => {
      console.error('Error sending verification mail:', e.message);
    });
  }

  cb();
});

UserSchema.method('signJwt', function(extraTokenPayload = {}, expires = '1h') {
  const user = this;

  return jwt.sign({ sub: user._id, ...extraTokenPayload }, JWT_SECRET, {
    expiresIn: expires,
  });
});

UserSchema.method('checkRole', function(roles) {
  const user = this;

  if (roles && !Array.isArray(roles)) roles = [roles];

  return roles.includes(user.role);
});

UserSchema.method('sendPasswordResetEmail', async function() {
  const user = this;

  if (!user.passwordResetToken) {
    throw new Error('no_reset_token');
  }

  const resetUrl = `${process.env.HOST}/users/${
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

UserSchema.method('sendVerificationEmail', async function() {
  const user = this;

  if (!user.verificationToken) {
    throw new Error('no_verification_token');
  }

  const verifyUrl = `${process.env.HOST}/users/${user._id}/verify?token=${
    user.verificationToken
  }`;

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

UserSchema.method('sanitize', function() {
  const user = this.toObject();

  user.id = user._id;
  delete user._id;
  delete user.__v;
  delete user.password;
  delete user.salt;
  delete user.role;
  delete user.passwordResetToken;
  delete user.verificationToken;
  delete user.facebook;

  return user;
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
