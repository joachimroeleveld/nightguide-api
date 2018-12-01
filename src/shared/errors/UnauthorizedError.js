const { UNAUTHORIZED } = require('http-status');
const PublicError = require('./PublicError');

class UnauthorizedError extends PublicError {
  /**
   *
   * @param {string} [message] - text description of the error
   */
  constructor(message = 'Unauthorized') {
    super(UNAUTHORIZED, message);
  }
}

module.exports = UnauthorizedError;
