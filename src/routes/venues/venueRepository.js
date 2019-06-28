const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const _ = require('lodash');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Venue = require('./venueModel');
const VenueImage = require('./venueImageModel');
const {
  serialize,
  deserialize,
  deserializeImage,
} = require('./lib/serialization');
const { match, sort } = require('./lib/aggregation');

function createVenue(data) {
  return Venue.create(data);
}

async function updateVenue(id, data, options) {
  const doc = _.omit(data, ['images']);
  const venue = await Venue.findByIdAndUpdate(id, doc, {
    new: true,
    ...options,
  }).exec();

  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  return venue;
}

async function getVenues(opts, withCount = false) {
  const {
    populate = [],
    fields,
    offset,
    limit,
    sortBy,
    longitude,
    latitude,
    tags,
    ...filters
  } = opts;

  const agg = Venue.aggregate();

  let countAgg;
  if (withCount) {
    countAgg = match(Venue.aggregate(), filters);
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  if (sortBy && sortBy.distance) {
    if (!longitude || !latitude) {
      throw new InvalidArgumentError('missing_coordinates');
    }
    agg.near({
      near: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      distanceField: 'distance',
      spherical: true,
    });
  }

  match(agg, filters);

  sort(agg, {
    sortBy,
    tags,
  });

  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  if (populate.includes('images')) {
    agg.lookup({
      from: 'venueimages',
      foreignField: '_id',
      localField: 'images',
      as: 'images',
    });
  }
  if (populate.includes('tags')) {
    agg.lookup({
      from: 'tags',
      foreignField: '_id',
      localField: 'tags',
      as: 'tags',
    });
  }

  if (fields) {
    let project = [];
    // pageSlug field is required for serialization
    project.push('pageSlug');
    project = project.concat(fields);
    agg.project(_.uniq(project).join(' '));
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

function countVenues(filter) {
  return Venue.count(filter).exec();
}

async function getVenue(venueId, opts = {}) {
  const { populate = [] } = opts;

  return await Venue.findById(venueId)
    .populate(populate.join(' '))
    .exec();
}

async function deleteVenue(id, opts) {
  return Venue.findByIdAndRemove(id, opts).exec();
}

async function uploadVenueImage(venueId, { buffer, mime, perspective }) {
  if (!imagesService.SUPPORTED_MIME_TYPES.includes(mime)) {
    throw new InvalidArgumentError('invalid_mime');
  }

  const venue = await Venue.findById(venueId).exec();
  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  const image = new VenueImage({
    filesize: buffer.byteLength,
    filetype: mime,
    perspective,
  });

  image.filename = `${image._id}.${mimeTypes.extension(mime)}`;

  try {
    await imagesService.upload(image.filename, mime, buffer);

    const dimensions = imgSize(buffer);

    image.url = await imagesService.getServeableUrl(image.filename);
    image.width = dimensions.width;
    image.height = dimensions.height;

    await image.save();

    venue.images.push(image._id);

    await venue.save();

    return image;
  } catch (e) {
    console.error('Upload error: ', e);
    throw new Error('upload_failed');
  }
}

async function uploadVenueImageByUrl(venueId, image) {
  const { url, perspective } = image;
  const res = await request.get({
    uri: url,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const mime = res.headers['content-type'];

  return await uploadVenueImage(venueId, {
    buffer: res.body,
    perspective,
    mime,
  });
}

module.exports = {
  createVenue,
  getVenues,
  getVenue,
  countVenues,
  updateVenue,
  deleteVenue,
  uploadVenueImage,
  uploadVenueImageByUrl,
  serialize,
  deserialize,
  deserializeImage,
};
