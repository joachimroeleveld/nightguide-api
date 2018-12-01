const { PRECONDITION_FAILED } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when system was unable to find entity that client has requested to perform an operation on
 */
class PreconditionFailedError extends PublicError {
  /**
   *
   * @param {string} message - text description of the error
   */
  constructor(message = 'Precondition failed') {
    super(PRECONDITION_FAILED, message);
  }
}

module.exports = PreconditionFailedError;
