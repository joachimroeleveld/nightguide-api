const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv4 = require('uuid/v4');

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
  url: {
    type: String,
    required: true,
  },
});

VenueImageSchema.method('sanitize', function() {
  const venueImage = this.toObject();

  venueImage.id = venueImage._id;
  delete venueImage._id;
  delete venueImage.__v;

  return venueImage;
});

module.exports = mongoose.model('VenueImage', VenueImageSchema);
