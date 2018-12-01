const { ValidationError } = require('express-openapi-validate');

const config = require('../shared/config');
const {
  PublicError,
  ServerError,
  InvalidArgumentError,
} = require('../shared/errors');

function handle(res, error, next) {
  console.error('Internal error: ', error);

  // If headers were already sent to the client, delegate to default error handling
  if (res.headersSent) {
    return next(error);
  }

  const { message, statusCode } = _resolvePublicError(error);
  const response = {
    message,
    status: statusCode,
  };

  if (!config.isProduction && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

function _resolvePublicError(internalError) {
  if (internalError instanceof PublicError) {
    return internalError;
  }

  if (internalError instanceof ValidationError) {
    return new InvalidArgumentError(internalError.message);
  }

  return new ServerError();
}

module.exports = {
  handle,
};
