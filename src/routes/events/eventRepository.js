const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Event = require('./eventModel');
const EventImage = require('./eventImageModel');

function createEvent(data) {
  return Event.create(data);
}

function updateEvent(id, data, options) {
  return Event.findByIdAndUpdate(id, data, { new: true, ...options }).exec();
}

function getEvents(opts) {
  const {
    populate = [],
    fields = [],
    offset,
    limit,
    sortBy,
    filter,
    locationFilter,
  } = opts;

  const query = Event.find();

  if (locationFilter) {
    fields.push('location');
  }

  query.populate(populate.join(' '));

  if (!sortBy) {
    // Order by title by default
    query.sort({ title: 1 });
  }
  if (fields) {
    query.select(fields);
  }
  if (offset) {
    query.skip(offset);
  }
  if (limit) {
    query.limit(limit);
  }
  if (filter) {
    query.where(filter);
  }
  if (locationFilter) {
    query.where(locationFilter);
  }

  return query.exec();
}

function getEvent(eventId, opts = {}) {
  const { populate = [] } = opts;

  return Event.findById(eventId)
    .populate(populate.join(' '))
    .exec();
}

async function uploadEventImage(eventId, { buffer, mime }) {
  if (!imagesService.SUPPORTED_MIME_TYPES.includes(mime)) {
    throw new InvalidArgumentError('invalid_mime');
  }

  const event = await Event.findById(eventId).exec();
  if (!event) {
    throw new NotFoundError('event_not_found');
  }

  const image = new EventImage({
    filesize: buffer.byteLength,
    filetype: mime,
  });

  image.filename = `${image._id}.${mimeTypes.extension(mime)}`;

  try {
    await imagesService.upload(image.filename, mime, buffer);

    const dimensions = imgSize(buffer);

    image.url = await imagesService.getServeableUrl(image.filename);
    image.width = dimensions.width;
    image.height = dimensions.height;

    await image.save();

    event.images.push(image._id);

    await event.save();

    return image;
  } catch (e) {
    console.error('Upload error: ', e);
    throw new Error('upload_failed');
  }
}

async function uploadEventImageByUrl(eventId, image) {
  const { url, perspective } = image;
  const res = await request.get({
    uri: url,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const mime = res.headers['content-type'];

  return await uploadEventImage(eventId, {
    buffer: res.body,
    perspective,
    mime,
  });
}

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  uploadEventImage,
  uploadEventImageByUrl,
};
