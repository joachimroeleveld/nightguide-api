const fs = require('fs');
const jsYaml = require('js-yaml');

const { SPEC_FILE_NAME } = require('../shared/constants');

const openApiSpec = jsYaml.safeLoad(fs.readFileSync(SPEC_FILE_NAME, 'utf-8'));

module.exports = openApiSpec;
