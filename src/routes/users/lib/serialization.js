const moment = require('moment');

function deserialize(user) {
  if (user.toObject) {
    user = user.toObject();
  } else {
    user = _.cloneDeep(user);
  }

  if (user.birthday) {
    user.birthday = moment(user.birthday).format('YYYY-MM-DD');
  }

  user.id = user._id;
  delete user._id;
  delete user.password;
  delete user.salt;
  delete user.role;
  delete user.passwordResetToken;
  delete user.verificationToken;
  delete user.facebook;

  return user;
}

module.exports = {
  deserialize,
};
