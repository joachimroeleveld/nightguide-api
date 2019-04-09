const compose = require('compose-middleware').compose;

const {
  jwtAuth,
  checkRole,
  authenticateAppClient,
} = require('../framework/middleware');
const { USER_ROLES } = require('./constants');

const checkIsApp = () => authenticateAppClient();
const standardAuth = () =>
  compose([
    authenticateAppClient(),
    checkRole([USER_ROLES.ROLE_STANDARD, USER_ROLES.ROLE_ADMIN]),
  ]);
const adminAuth = () => checkRole(USER_ROLES.ROLE_ADMIN);

module.exports = {
  standardAuth,
  adminAuth,
  checkIsApp,
};
