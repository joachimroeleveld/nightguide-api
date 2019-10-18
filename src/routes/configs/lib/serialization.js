const _ = require('lodash');

/**
 * Prepare config object to be sent to client.
 * @returns {Event}
 */
function deserialize(config) {
  if (config.toObject) {
    config = config.toObject();
  } else {
    config = _.cloneDeep(config);
  }

  config.id = config._id;
  delete config._id;

  return config;
}

/**
 * Prepare config object for database insertion.
 * @param config
 */
function serialize(config) {
  if (config.id) {
    config._id = config.id;
    delete config.id;
  }

  return config;
}

module.exports = {
  deserialize,
  serialize,
};
