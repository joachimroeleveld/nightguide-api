const _ = require('lodash');

function deepFreeze(object) {
  if (!_.isObjectLike(object)) {
    return;
  }

  Object.freeze(object);

  _.forOwn(object, function(value) {
    if (!_.isObjectLike(value) || Object.isFrozen(value)) {
      return;
    }

    deepFreeze(value);
  });

  return object;
}

module.exports = {
  deepFreeze,
};
