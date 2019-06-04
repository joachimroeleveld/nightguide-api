const Tag = require('./tagModel');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');

async function getTags() {
  return await Tag.find({}).exec();
}

async function getTag(tagId, opts = {}) {
  return await Tag.findById(tagId).exec();
}

async function createTag(data) {
  return Tag.create(data);
}

async function updateTag(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const tag = await Tag.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (!tag) {
    throw new NotFoundError('tag_not_found');
  }

  return tag;
}

async function deleteTag(id, opts) {
  return Tag.findByIdAndRemove(id, opts).exec();
}

module.exports = {
  getTags,
  createTag,
  getTag,
  updateTag,
  deleteTag,
  serialize,
  deserialize,
};
