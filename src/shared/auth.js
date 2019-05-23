const { checkRole } = require('../framework/middleware');
const { USER_ROLES } = require('./constants');

// NOTE: JWT token is checked at top level

const userAuth = () =>
  checkRole([USER_ROLES.ROLE_STANDARD, USER_ROLES.ROLE_ADMIN]);
const adminAuth = () => checkRole(USER_ROLES.ROLE_ADMIN);

module.exports = {
  userAuth,
  adminAuth,
};
