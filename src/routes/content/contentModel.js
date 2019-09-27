const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { translatedSchema } = require('../../shared/schemas');
const { CONTENT_TYPES } = require('../../shared/constants');
const { deserialize } = require('./lib/serialization');

const ContentSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(CONTENT_TYPES),
    },
    title: translatedSchema,
    urlSlugs: {
      type: [String],
      validate: arr => !!arr.length,
    },
    pageSlug: String,
  },
  {
    timestamps: true,
    strict: false,
  }
);

ContentSchema.index({ urlSlugs: 1 });

ContentSchema.virtual('urlSlug').get(function() {
  return this.urlSlugs[0];
});

ContentSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Content', ContentSchema);
