const { BAD_REQUEST } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when client has specified invalid arguments for the request
 */
class InvalidArgumentError extends PublicError {
  /**
   *
   * @param {string} [message] - text description of the error
   */
  constructor(message = 'Invalid argument') {
    super(BAD_REQUEST, message);
  }
}

module.exports = InvalidArgumentError;
