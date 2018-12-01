const { BAD_REQUEST } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when client has specified invalid arguments for the request
 */
class InvalidRequestError extends PublicError {
  /**
   *
   * @param {string} [message] - text description of the error
   */
  constructor(message = 'Invalid request') {
    super(BAD_REQUEST, message);
  }
}

module.exports = InvalidRequestError;
