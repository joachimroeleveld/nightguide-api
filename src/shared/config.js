/**
 * Get value for config property with specified name
 * @param {String} name
 */
function get(name) {
  return process.env[name];
}

/**
 * Get boolean value for config property with specified name
 * @param name
 * @returns {boolean} true if config value equals to "true" (case-insensitive) and false in all other cases
 */
function getBoolean(name) {
  return !!process.env[name] && process.env[name].toLowerCase() === 'true';
}

function getIsProduction() {
  return (
    process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production'
  );
}

module.exports = {
  get,
  getBoolean,
  getIsProduction,
};
