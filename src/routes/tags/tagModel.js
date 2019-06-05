const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { translatedSchema } = require('../../shared/schemas');
const { deserialize } = require('./lib/serialization');

const TagSchema = new Schema(
  {
    _id: String,
    name: translatedSchema,
  },
  {
    timestamps: true,
  }
);

TagSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Tag', TagSchema);
