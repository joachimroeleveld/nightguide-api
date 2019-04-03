const { OpenApiValidator } = require('express-openapi-validate');
const OpenApiRequestCoercer = require('openapi-request-coercer').default; // TODO remove
const openApiSpec = require('../framework/openApiSpec');

exports.validator = new OpenApiValidator(openApiSpec);

exports.coerce = (method, path) => {
  return (req, res, next) => {
    const parameters = openApiSpec.paths[path][method].parameters;
    const coercer = new OpenApiRequestCoercer({ parameters });
    coercer.coerce(req);
    next();
  };
};
