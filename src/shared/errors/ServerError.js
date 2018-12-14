const { INTERNAL_SERVER_ERROR } = require('http-status');
const PublicError = require('./PublicError');

/**
 * This error is thrown when unrecognized internal error has occurred
 */
class ServerError extends PublicError {
  constructor(type = 'server_error', message = 'Internal error') {
    super(INTERNAL_SERVER_ERROR, type, message);
  }
}

module.exports = ServerError;
