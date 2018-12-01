const { OpenApiValidator } = require('express-openapi-validate');
const openApiSpec = require('../framework/openApiSpec');

module.exports = new OpenApiValidator(openApiSpec);
