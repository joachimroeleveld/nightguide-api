const { INTERNAL_SERVER_ERROR } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when unrecognized internal error has occurred
 */
class ServerError extends PublicError {
  /**
   *
   * @param {string} [message] - text description of the error
   */
  constructor(message = 'Internal error') {
    super(INTERNAL_SERVER_ERROR, message);
  }
}

module.exports = ServerError;
