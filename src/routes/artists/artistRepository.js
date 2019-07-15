const Artist = require('./artistModel');
const _ = require('lodash');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');

async function getArtists(opts = {}) {
  const { ids, query: textFilter } = opts;

  const query = Artist.find();

  const where = {};

  if (ids) {
    where._id = { $in: ids };
  }
  if (textFilter && textFilter.length >= 2) {
    where.name = new RegExp(`\\b${textFilter}`, 'i');
  }

  query.where(where).sort({ name: 1 });

  return await query.exec();
}

async function getArtist(artistId, opts = {}) {
  return await Artist.findById(artistId).exec();
}

async function createArtist(data) {
  return Artist.create(data);
}

async function updateArtist(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
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
