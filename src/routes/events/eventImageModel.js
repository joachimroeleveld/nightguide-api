const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');

const { deserializeImage } = require('./lib/serialization');

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

EventImageSchema.method('deserialize', function() {
  return deserializeImage(this);
});

module.exports = mongoose.model('EventImage', EventImageSchema);
