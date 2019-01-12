const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash');

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

TagSchema.static('deserialize', tag => {
  if (tag.toObject) {
    tag = tag.toObject();
  } else {
    tag = _.cloneDeep(tag);
  }

  tag.id = tag._id;
  delete tag._id;
  delete tag.__v;

  return tag;
});

TagSchema.method('deserialize', function() {
  return TagSchema.statics.deserialize(this);
});

module.exports = mongoose.model('Tag', TagSchema);
