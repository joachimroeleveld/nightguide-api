const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const { CONTENT_TYPES } = require('../../shared/constants');
const contentModels = require('./contentModels');
const { slugifyUrlString } = require('./lib/urlSlugs');
const { serialize, deserialize } = require('./lib/serialization');
const { match } = require('./lib/aggregation');

async function getContent(type, opts, withCount = false) {
  _validateContentType(type);

  const Model = contentModels[type];

  const { offset, limit, ...filters } = opts;

  const createAgg = () => {
    const agg = Model.aggregate();
    return match(agg, filters);
  };

  let countAgg;
  if (withCount) {
    countAgg = createAgg();
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  const agg = createAgg();

  agg.sort({ name: 1 });

  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  const results = await agg.exec();

  if (withCount) {
    const countResult = await countAgg.exec();
    const count = (countResult.length && countResult[0].totalCount) || 0;
    return { totalCount: count, results };
  } else {
    return results;
  }
}

async function createContent(type, data) {
  _validateContentType(type);

  const Model = contentModels[type];
  const doc = new Model(data);

  const slugBase =
    data.urlSlugs && data.urlSlugs.length ? data.urlSlugs[0] : data.title.en;
  const urlSlug = await _generateUniqueSlug(type, slugBase);
  doc.urlSlugs.push(urlSlug);

  await doc.save();

  return doc;
}

async function getContentSingle(type, query) {
  _validateContentType(type);

  if (typeof query === 'string') {
    query = { _id: query };
  }

  const Model = contentModels[type];

  return Model.findOne(query).exec();
}

async function updateContentSingle(type, query, update) {
  _validateContentType(type);

  if (typeof query === 'string') {
    query = { _id: query };
  }

  const Model = contentModels[type];

  const doc = await getContentSingle(type, query);
  if (!doc) {
    throw new NotFoundError('content_not_found');
  }

  if (update.urlSlugs && doc.urlSlugs[0] !== update.urlSlugs[0]) {
    const newSlug = await _generateUniqueSlug(type, update.urlSlugs[0]);
    update.urlSlugs[0] = doc.urlSlugs[0];
    update.urlSlugs.unshift(newSlug);
  }

  return Model.findOneAndUpdate(query, update, { new: true }).exec();
}

async function deleteContentSingle(type, query) {
  _validateContentType(type);

  if (typeof query === 'string') {
    query = { _id: query };
  }

  const Model = contentModels[type];

  return Model.deleteOne(query).exec();
}

async function getContentByUrlSlug(type, urlSlug) {
  return getContentSingle(type, { urlSlugs: urlSlug });
}

async function _generateUniqueSlug(type, string) {
  let slugRev = 1;
  const slugBase = slugifyUrlString(string);
  let uniqueSlug = null;
  while (uniqueSlug === null) {
    const candidateSlug = slugBase + (slugRev === 1 ? '' : `-${slugRev}`);
    const existingDoc = await getContentByUrlSlug(type, candidateSlug);
    if (!existingDoc) {
      uniqueSlug = candidateSlug;
    } else {
      slugRev++;
    }
  }
  return uniqueSlug;
}

function _validateContentType(type) {
  if (!Object.values(CONTENT_TYPES).includes(type)) {
    throw new InvalidArgumentError('invalid_content_type');
  }
}

module.exports = {
  getContent,
  createContent,
  getContentSingle,
  getContentByUrlSlug,
  updateContentSingle,
  deleteContentSingle,
  serialize,
  deserialize,
};
