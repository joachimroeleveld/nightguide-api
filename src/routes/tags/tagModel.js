const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { TAG_TYPES } = require('../../shared/constants');

const TagSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(TAG_TYPES),
    index: true,
  },
});

TagSchema.static('types', TAG_TYPES);

TagSchema.method('sanitize', function() {
  const tag = this.toObject();

  tag.id = tag._id;
  delete tag._id;
  delete tag.__v;

  return tag;
});

module.exports = mongoose.model('Tag', TagSchema);
