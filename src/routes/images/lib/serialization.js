const _ = require('lodash');

function deserializeImage(image) {
  if (image.toObject) {
    image = image.toObject();
  } else {
    image = _.cloneDeep(image);
  }

  image.id = image._id;
  delete image._id;

  return image;
}

module.exports = {
  deserializeImage,
};
