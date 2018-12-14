const { PRECONDITION_FAILED } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when system was unable to find entity that client has requested to perform an operation on
 */
class PreconditionFailedError extends PublicError {
  constructor(type = 'precondition_failed', message = 'Precondition failed') {
    super(PRECONDITION_FAILED, type, message);
  }
}

module.exports = PreconditionFailedError;
