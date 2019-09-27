const { NotFoundError } = require('../../shared/errors');
const Content = require('./contentModel');
const { slugifyUrlString } = require('./lib/urlSlugs');
const { serialize, deserialize } = require('./lib/serialization');
const { match } = require('./lib/aggregation');

async function getContent(opts, withCount = false) {
  const { offset, limit, ...filters } = opts;

  const createAgg = () => {
    const agg = Content.aggregate();
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

async function createContent(data) {
  const doc = new Content(data);

  const slugBase =
    data.urlSlugs && data.urlSlugs.length ? data.urlSlugs[0] : data.title.en;
  const urlSlug = await _generateUniqueSlug(slugBase);
  doc.urlSlugs.push(urlSlug);

  await doc.save();

  return doc;
}

async function getContentSingle(query) {
  if (typeof query === 'string') {
    query = { _id: query };
  }

  return Content.findOne(query).exec();
}

async function updateContentSingle(query, update) {
  if (typeof query === 'string') {
    query = { _id: query };
  }

  const doc = await getContentSingle(query);
  if (!doc) {
    throw new NotFoundError('content_not_found');
  }

  if (update.urlSlugs && doc.urlSlugs[0] !== update.urlSlugs[0]) {
    const newSlug = await _generateUniqueSlug(update.urlSlugs[0]);
    update.urlSlugs[0] = doc.urlSlugs[0];
    update.urlSlugs.unshift(newSlug);
  }

  return Content.findOneAndUpdate(query, update, { new: true }).exec();
}

async function deleteContentSingle(query) {
  if (typeof query === 'string') {
    query = { _id: query };
  }

  return Content.deleteOne(query).exec();
}

async function getContentByUrlSlug(urlSlug) {
  return getContentSingle({ urlSlugs: urlSlug });
}

async function _generateUniqueSlug(string) {
  let slugRev = 1;
  const slugBase = slugifyUrlString(string);
  let uniqueSlug = null;
  while (uniqueSlug === null) {
    const candidateSlug = slugBase + (slugRev === 1 ? '' : `-${slugRev}`);
    const existingDoc = await getContentByUrlSlug(candidateSlug);
    if (!existingDoc) {
      uniqueSlug = candidateSlug;
    } else {
      slugRev++;
    }
  }
  return uniqueSlug;
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
