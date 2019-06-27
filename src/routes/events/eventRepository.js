const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const _ = require('lodash');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Event = require('./eventModel');
const EventImage = require('./eventImageModel');
const { match, sort } = require('./lib/aggregation');
const {
  serialize,
  deserialize,
  deserializeImage,
} = require('./lib/serialization');

function createEvent(data) {
  return Event.create(data);
}

async function updateEvent(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const doc = _.omit(data, ['images']);
  const event = await Event.findOneAndUpdate(where, doc, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (!event) {
    throw new NotFoundError('event_not_found');
  }

  return event;
}

async function getEvents(opts, withCount = false) {
  const {
    fields = [],
    offset,
    limit,
    sortBy,
    populate = [],
    ...filters
  } = opts;
  const agg = match(Event.aggregate(), filters);

  let countAgg;
  if (withCount) {
    countAgg = match(Event.aggregate(), filters);
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  if (sortBy) {
    sort(agg, sortBy);
  }

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
      from: 'eventimages',
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
  if (populate.includes('organiser.venue')) {
    agg.lookup({
      from: 'venues',
      let: { venue: '$organiser.venue' },
      pipeline: [
        { $match: { $expr: { $eq: ['$$venue', '$_id'] } } },
        { $project: { name: 1, location: 1 } },
      ],
      as: 'organiser.venue',
    });
    agg.unwind({
      path: '$organiser.venue',
      preserveNullAndEmptyArrays: true,
    });
  }

  const project = {};

  if (fields.length) {
    fields.forEach(field => {
      project[field] = 1;
    });
  } else {
    project.nextDate = 0;
    project.tagsMatchScore = 0;
  }

  agg.project(project);

  const results = await agg.exec();

  if (withCount) {
    const countResult = await countAgg.exec();
    const count = (countResult.length && countResult[0].totalCount) || 0;
    return { totalCount: count, results };
  } else {
    return results;
  }
}

async function getEvent(conditions, opts = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const { populate = [] } = opts;

  return await Event.findOne(where)
    .populate(populate.join(' '))
    .exec();
}

function getEventByFbId(fbId, opts = {}) {
  return getEvent({ 'facebook.id': fbId }, opts);
}

function countEvents(filter) {
  return Event.count(filter).exec();
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

  if (!image) {
    return false;
  }

  await imagesService.deleteFile(image.filename);

  await EventImage.findByIdAndRemove(imageId).exec();

  await Event.findByIdAndUpdate(eventId, {
    $pull: { images: imageId },
  }).exec();
}

async function deleteEvent(id, opts) {
  return Event.findByIdAndRemove(id, opts).exec();
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
  updateEvent,
  uploadEventImage,
  uploadEventImageByUrl,
  deleteEvent,
  deleteEvents,
  deleteEventImageById,
  serialize,
  deserialize,
  deserializeImage,
};
