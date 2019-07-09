const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { deserialize } = require('./lib/serialization');

const ArtistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ArtistSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Artist', ArtistSchema);
