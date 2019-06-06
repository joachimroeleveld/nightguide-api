const Tag = require('./tagModel');
const _ = require('lodash');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');

async function getTags(opts = {}) {
  const { ids, slugs } = opts;

  const query = Tag.find();

  const where = {};

  if (ids) {
    where._id = { $in: ids };
  }
  if (slugs) {
    where.slug = { $in: slugs };
  }

  query.where(where);

  return await query.exec();
}

async function getTag(tagId, opts = {}) {
  return await Tag.findById(tagId).exec();
}

async function getTagBySlug(slug, opts = {}) {
  return await Tag.findOne({ slug }).exec();
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
  getTagBySlug,
  updateTag,
  deleteTag,
  serialize,
  deserialize,
};
