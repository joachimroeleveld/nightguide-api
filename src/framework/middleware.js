const errorHandler = require('./errorHandler');
const auth = require('./auth');

const { UnauthorizedError } = require('../shared/errors');

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
};
