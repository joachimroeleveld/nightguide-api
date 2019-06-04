const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { deserialize } = require('./lib/serialization');

const TagSchema = new Schema(
  {
    _id: String,
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

TagSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Tag', TagSchema);
