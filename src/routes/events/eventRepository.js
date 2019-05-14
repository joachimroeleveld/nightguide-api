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

async function getEvents(opts) {
  const {
    populate = [],
    fields = [],
    offset,
    limit,
    sortBy,
    filter,
    locationFilter,
  } = opts;

  const agg = Event.aggregate();

  if (locationFilter) {
    fields.push('location');
  }

  if (filter) {
    agg.match(filter);
  }
  if (locationFilter) {
    agg.match(locationFilter);
  }
  if (fields.length) {
    agg.project(fields.join(' '));
  }
  if (!sortBy) {
    // Order by title by default
    agg.sort({ title: 1 });
  }
  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  const result = await agg.exec();

  if (populate.length) {
    for (const path in populate) {
      await Event.populate(result, { path: populate }).exec();
    }
  } else {
    return result;
  }
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
    ...opts,
    filter: {
      'organiser.venue': venueId.toString(),
      ...opts.filter,
    },
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
  const image = await EventImage.findById(imageId).exec();

  await imagesService.deleteFile(image.filename);

  await EventImage.findByIdAndRemove(imageId).exec();

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
