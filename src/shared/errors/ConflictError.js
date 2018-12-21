const { CONFLICT } = require('http-status');
const PublicError = require('./PublicError');

class ConflictError extends PublicError {
  constructor(type = 'conflict', message = 'Conflict') {
    super(CONFLICT, type, message);
  }
}

module.exports = ConflictError;
