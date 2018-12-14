const { BAD_REQUEST } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when client has specified invalid arguments for the request
 */
class InvalidRequestError extends PublicError {
  constructor(type = 'invalid_request', message = 'Invalid request') {
    super(BAD_REQUEST, type, message);
  }
}

module.exports = InvalidRequestError;
