const { UNAUTHORIZED } = require('http-status');
const PublicError = require('./PublicError');

class UnauthorizedError extends PublicError {
  constructor(type = 'unauthorized', message = 'Unauthorized') {
    super(UNAUTHORIZED, type, message);
  }
}

module.exports = UnauthorizedError;
