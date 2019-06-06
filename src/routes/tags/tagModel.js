const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { translatedSchema } = require('../../shared/schemas');
const { deserialize } = require('./lib/serialization');

const TagSchema = new Schema(
  {
    slug: {
      required: true,
      type: String,
    },
    name: {
      required: true,
      type: translatedSchema,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ slug: 1 });

TagSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Tag', TagSchema);
