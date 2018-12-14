const { NOT_FOUND } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when system was unable to find entity that client has requested to perform an operation on
 */
class NotFoundError extends PublicError {
  constructor(type = 'not_found', message = 'Not found') {
    super(NOT_FOUND, type, message);
  }
}

module.exports = NotFoundError;
