const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const EventImageSchema = new Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  filename: {
    type: String,
    required: true,
  },
  filetype: String,
  filesize: Number,
  width: Number,
  height: Number,
  url: {
    type: String,
    required: true,
  },
});

EventImageSchema.static('deserialize', image => {
  if (image.toObject) {
    image = image.toObject();
  } else {
    image = _.cloneDeep(image);
  }

  image.id = image._id;
  delete image._id;
  delete image.__v;

  return image;
});

EventImageSchema.method('deserialize', function() {
  return EventImageSchema.statics.deserialize(this);
});

module.exports = mongoose.model('EventImage', EventImageSchema);
