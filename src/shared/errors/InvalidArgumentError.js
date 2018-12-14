const { BAD_REQUEST } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when client has specified invalid arguments for the request
 */
class InvalidArgumentError extends PublicError {
  constructor(type = 'invalid_argument', message = 'Invalid argument') {
    super(BAD_REQUEST, type, message);
  }
}

module.exports = InvalidArgumentError;
