const { OpenApiValidator } = require('express-openapi-validate');
const OpenApiRequestCoercer = require('openapi-request-coercer').default; // TODO remove
const openApiSpec = require('../framework/openApiSpec');

exports.validator = new OpenApiValidator(openApiSpec);

exports.coerce = (method, path) => {
  return (req, res, next) => {
    const spec = openApiSpec.paths[path][method];
    const coercer = new OpenApiRequestCoercer(spec);
    coercer.coerce(req);
    next();
  };
};
