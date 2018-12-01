const compose = require('compose-middleware').compose;

const { jwtAuth, checkRole } = require('../framework/middleware');
const { USER_ROLES } = require('./constants');

const standardAuth = () =>
  compose([
    jwtAuth(),
    checkRole([USER_ROLES.ROLE_STANDARD, USER_ROLES.ROLE_ADMIN]),
  ]);
const adminAuth = () => compose([jwtAuth(), checkRole(USER_ROLES.ROLE_ADMIN)]);

module.exports = {
  standardAuth,
  adminAuth,
};
