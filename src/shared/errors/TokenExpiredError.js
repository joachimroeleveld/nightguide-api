const UnauthorizedError = require('./UnauthorizedError');

class TokenExpiredError extends UnauthorizedError {
  constructor(type = 'token_exired', message = 'Token expired') {
    super(type, message);
  }
}

module.exports = TokenExpiredError;
