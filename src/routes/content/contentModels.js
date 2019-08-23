const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { translatedSchema } = require('../../shared/schemas');
const { CONTENT_TYPES } = require('../../shared/constants');
const { deserialize } = require('./lib/serialization');

const ContentSchema = new Schema(
  {
    title: translatedSchema,
    urlSlugs: {
      type: [String],
      validate: arr => !!arr.length,
    },
    pageSlug: {
      type: String,
      required: true,
    },
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

const models = Object.values(CONTENT_TYPES).reduce(
  (models, type) => ({
    ...models,
    [type]: mongoose.model(type, ContentSchema, type.replace(/-/g, '')),
  }),
  {}
);

module.exports = models;
