const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const unidecode = require('unidecode');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Venue = require('./venueModel');
const VenueImage = require('./venueImageModel');
const { applyFilterOnQuery } = require('./lib/filters');

const IMAGE_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

function createVenue(data) {
  return Venue.create(data);
}

function updateVenue(id, data, options) {
  return Venue.findByIdAndUpdate(id, data, { new: true, ...options }).exec();
}

function getVenues(opts) {
  const {
    populate = [],
    fields,
    offset,
    limit,
    query: textFilter,
    sortBy,
    longitude,
    latitude,
    filter,
  } = opts;

  const conditions = {};
  if (textFilter && textFilter.length >= 2) {
    conditions.queryText = new RegExp(`\\b${unidecode(textFilter)}`, 'i');
  }
  if (sortBy && sortBy.distance) {
    if (!longitude || !latitude) {
      throw new InvalidArgumentError('missing_coordinates');
    }
    conditions['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
    };
  }

  const query = Venue.find(conditions);

  query.populate(populate.join(' '));

  if (!sortBy) {
    // Order by name by default
    query.sort({ name: 1 });
  }
  if (fields) {
    // Location field is required for serialization
    query.select(['location.city', ...fields]);
  }
  if (offset) {
    query.skip(offset);
  }
  if (limit) {
    query.limit(limit);
  }
  if (filter) {
    applyFilterOnQuery(query, filter);
  }

  return query.exec();
}

function getVenue(venueId, opts = {}) {
  const { populate = [] } = opts;

  return Venue.findById(venueId)
    .populate(populate.join(' '))
    .exec();
}

async function uploadVenueImage(venueId, { buffer, mime, perspective }) {
  if (!IMAGE_MIME_TYPES.includes(mime)) {
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
  updateVenue,
  uploadVenueImage,
  uploadVenueImageByUrl,
};
