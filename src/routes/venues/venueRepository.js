const path = require('path');
const request = require('request-promise-native');
const imgSize = require('image-size');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Venue = require('./venueModel');
const VenueImage = require('./venueImageModel');

const IMAGE_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

function createVenue(data) {
  return Venue.create(data);
}

function updateVenue(id, data, options) {
  return Venue.findByIdAndUpdate(id, data, { new: true, ...options }).exec();
}

function getVenues(opts) {
  const query = Venue.find();
  const { populate = [], fields, offset, limit } = opts;

  query.populate(populate.join(' '));
  if (fields) {
    query.select(fields);
  }
  if (offset) {
    query.skip(offset);
  }
  if (limit) {
    query.limit(limit);
  }

  return query.exec();
}

function getVenue(venueId, opts = {}) {
  const { populate = [] } = opts;

  return Venue.findById(venueId)
    .populate(populate.join(' '))
    .exec();
}

async function uploadVenueImage(venueId, { buffer, mime, name }) {
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
  });

  image.filename = image._id + path.extname(name);

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

async function uploadVenueImageByUrl(venueId, uri) {
  const res = await request.get({
    uri,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const name = uri.split('/').pop();
  const mime = res.headers['content-type'];

  return await uploadVenueImage(venueId, { buffer: res.body, name, mime });
}

module.exports = {
  createVenue,
  getVenues,
  getVenue,
  updateVenue,
  uploadVenueImage,
  uploadVenueImageByUrl,
};
