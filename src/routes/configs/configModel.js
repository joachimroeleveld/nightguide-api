const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { deserialize } = require('./lib/serialization');

const ConfigSchema = new Schema(
  {
    name: {
      required: true,
      type: String,
    },
    pageSlug: String,
    payload: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

ConfigSchema.index(
  {
    name: 1,
    pageSlug: 1,
  },
  {
    unique: true,
  }
);

ConfigSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Config', ConfigSchema);
