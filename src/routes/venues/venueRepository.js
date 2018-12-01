const path = require('path');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Venue = require('./venueModel');
const VenueImage = require('./venueImageModel');

const IMAGE_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg'];

function createVenue(data) {
  return Venue.create(data);
}

function getVenues() {
  return Venue.find().exec();
}

function getVenue(venueId) {
  return Venue.findById(venueId)
    .populate('tags')
    .exec();
}

async function uploadVenueImage(venueId, { buffer, mime, name, size }) {
  if (!IMAGE_MIME_TYPES.includes(mime)) {
    return cb(new InvalidArgumentError('invalid_mime'));
  }

  const venue = await Venue.findById(venueId).exec();
  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  const image = new VenueImage({
    filesize: size,
    filetype: mime,
  });

  image.filename = image._id + path.extname(name);

  try {
    await imagesService.upload(image.filename, buffer);

    image.url = await imagesService.getServeableUrl(image.filename);

    venue.images.push(image);

    await venue.save();

    return image;
  } catch (e) {
    console.error('Upload error: ', e);
    throw new Error('upload_failed');
  }
}

module.exports = {
  createVenue,
  getVenues,
  getVenue,
  uploadVenueImage,
};
