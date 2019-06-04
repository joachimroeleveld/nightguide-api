const _ = require('lodash');

/**
 * Prepare tag object to be sent to client.
 * @returns {Event}
 */
function deserialize(tag) {
  if (tag.toObject) {
    tag = tag.toObject();
  } else {
    tag = _.cloneDeep(tag);
  }

  tag.id = tag._id;
  delete tag._id;

  return tag;
}

/**
 * Prepare tag object for database insertion.
 * @param tag
 */
async function serialize(tag) {
  if (tag.id) {
    tag._id = tag.id;
    delete tag.id;
  }

  return tag;
}

module.exports = {
  deserialize,
  serialize,
};
