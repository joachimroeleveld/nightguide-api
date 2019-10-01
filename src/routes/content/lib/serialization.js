const _ = require('lodash');

const imageRepository = require('../../images/imageRepository');
const { isPopulated } = require('../../../shared/util/mongooseUtils');

/**
 * Prepare content object to be sent to client.
 * @returns {Event}
 */
function deserialize(content) {
  if (content.toObject) {
    content = content.toObject();
  } else {
    content = _.cloneDeep(content);
  }

  content.id = content._id;
  delete content._id;

  if (isPopulated(content.images)) {
    content.images = content.images.map(imageRepository.deserializeImage);
  }

  return content;
}

/**
 * Prepare content object for database insertion.
 * @param content
 */
function serialize(content) {
  if (content.id) {
    content._id = content.id;
    delete content.id;
  }

  return content;
}

module.exports = {
  deserialize,
  serialize,
};
