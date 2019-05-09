const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const _ = require('lodash');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Event = require('./eventModel');
const EventImage = require('./eventImageModel');
const {
  serialize,
  deserialize,
  deserializeImage,
} = require('./lib/serialization');

function createEvent(data) {
  return Event.create(data);
}

function updateEvent(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  return Event.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();
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

function getEvent(conditions, opts = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const { populate = [] } = opts;

  return Event.findOne(where)
    .populate(populate.join(' '))
    .exec();
}

function getEventByFbId(fbId, opts = {}) {
  return getEvent({ 'facebook.id': fbId }, opts);
}

function countEvents(filter) {
  return Event.count(filter).exec();
}

function getEventsByVenue(venueId, opts = {}) {
  return getEvents({
    filter: {
      'organiser.venue': venueId,
      ...opts.filter,
    },
    ...opts,
  });
}

async function uploadEventImage(eventId, { buffer, mime, ...otherImageProps }) {
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
    ...otherImageProps,
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
  const { url, ...otherImageProps } = image;
  const res = await request.get({
    uri: url,
    resolveWithFullResponse: true,
    encoding: null,
  });
  const mime = res.headers['content-type'];

  return await uploadEventImage(eventId, {
    buffer: res.body,
    mime,
    ...otherImageProps,
  });
}

async function deleteEventImageById(eventId, imageId) {
  await imagesService.deleteServeableUrl(imageId);

  await EventImage.findByIdAndDelete(imageId).exec();

  await Event.findByIdAndUpdate(eventId, {
    $pull: { images: imageId },
  }).exec();
}

async function deleteEvents(conditions, opts) {
  let where = conditions;
  if (Array.isArray(conditions)) {
    where = {
      _id: { $in: conditions },
    };
  }
  return Event.deleteMany(where, opts).exec();
}

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  getEventByFbId,
  getEventsByVenue,
  countEvents,
  updateEvent,
  uploadEventImage,
  uploadEventImageByUrl,
  deleteEvents,
  deleteEventImageById,
  serialize,
  deserialize,
  deserializeImage,
};
