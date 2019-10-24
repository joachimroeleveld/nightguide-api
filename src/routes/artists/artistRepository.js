const Artist = require('./artistModel');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');
const { match } = require('./lib/aggregation');
const { isValidObjectId } = require('../../shared/util/mongooseUtils');

async function getArtists(opts = {}, withCount = false) {
  const { offset, limit, ...filters } = opts;

  const createAgg = () => {
    const agg = Artist.aggregate();
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

async function getArtist(artistId, opts = {}) {
  return await Artist.findById(artistId).exec();
}

async function createArtist(data) {
  return Artist.create(data);
}

async function updateArtist(conditions, data, options = {}) {
  let where = conditions;
  if (isValidObjectId(conditions)) {
    where = { _id: conditions };
  }
  const artist = await Artist.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (!artist) {
    throw new NotFoundError('artist_not_found');
  }

  return artist;
}

async function deleteArtist(id, opts) {
  return Artist.findByIdAndRemove(id, opts).exec();
}

module.exports = {
  getArtists,
  createArtist,
  getArtist,
  updateArtist,
  deleteArtist,
  serialize,
  deserialize,
};
