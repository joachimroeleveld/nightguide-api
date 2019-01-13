const errorHandler = require('./errorHandler');
const auth = require('./auth');

const { UnauthorizedError } = require('../shared/errors');
const { USER_ROLES, CLIENT_IDS } = require('../shared/constants');

/**
 * Authenticate request with JWT and user role.
 * @returns {Function}
 */
function jwtAuth() {
  return async (req, res, next) => {
    try {
      req.user = await auth.getUserFromToken(req.token);

      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Check if authenticated user has the specified roles.
 * @param roles
 * @returns {Function}
 */
function checkRole(roles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.checkRole || !req.user.checkRole(roles)) {
      return next(new UnauthorizedError());
    }

    next();
  };
}

/**
 * Check if app token header is provided.
 * @returns {Function}
 */
function authenticateAppClient() {
  return (req, res, next) => {
    const isAdmin =
      req.user &&
      req.user.checkRole &&
      req.user.checkRole(USER_ROLES.ROLE_ADMIN);
    if (isAdmin) {
      return next();
    }
    if (!auth.checkAppTokenHeader(req)) {
      return next(new UnauthorizedError());
    } else {
      req.clientId = CLIENT_IDS.CLIENT_APP;
    }
    next();
  };
}

/**
 * Pass errors to the error handler and send back the error to the client
 * @returns {Function}
 */
function handleError() {
  return (err, req, res, next) => {
    errorHandler.handle(res, err, next);
  };
}

module.exports = {
  handleError,
  jwtAuth,
  checkRole,
  authenticateAppClient,
};
