const UnauthorizedError = require('./UnauthorizedError');

class TokenExpiredError extends UnauthorizedError {
  /**
   *
   * @param {string} [message] - text description of the error
   */
  constructor(message = 'Token expired') {
    super(message);
  }
}

module.exports = TokenExpiredError;
