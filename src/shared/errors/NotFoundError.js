const { NOT_FOUND } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when system was unable to find entity that client has requested to perform an operation on
 */
class NotFoundError extends PublicError {
  /**
   *
   * @param {string} message - text description of the error
   */
  constructor(message = 'Not found') {
    super(NOT_FOUND, message);
  }
}

module.exports = NotFoundError;
