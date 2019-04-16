const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const { VENUE_IMAGE_PERSPECTIVES } = require('../../shared/constants');

const VenueImageSchema = new Schema({
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
  perspective: {
    type: String,
    enum: Object.values(VENUE_IMAGE_PERSPECTIVES),
  },
});

VenueImageSchema.static('deserialize', venueImage => {
  if (venueImage.toObject) {
    venueImage = venueImage.toObject();
  } else {
    venueImage = _.cloneDeep(venueImage);
  }

  venueImage.id = venueImage._id;
  delete venueImage._id;
  delete venueImage.__v;

  return venueImage;
});

VenueImageSchema.method('deserialize', function() {
  return VenueImageSchema.statics.deserialize(this);
});

module.exports = mongoose.model('VenueImage', VenueImageSchema);
