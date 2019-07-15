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

ArtistSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 1 },
  }
);

ArtistSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Artist', ArtistSchema);
