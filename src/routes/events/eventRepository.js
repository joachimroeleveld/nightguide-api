const _ = require('lodash');

const imageRepository = require('../images/imageRepository');
const { NotFoundError } = require('../../shared/errors');
const Event = require('./eventModel');
const { match } = require('./lib/aggregation');
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

  const createAgg = () => {
    const agg = Event.aggregate();
    agg.unwind({
      path: '$dates',
      includeArrayIndex: 'dateIndex',
    });
    agg.addFields({
      date: '$dates',
    });
    return match(agg, filters);
  };

  const agg = createAgg();

  let countAgg;
  if (withCount) {
    countAgg = createAgg();
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  if (sortBy) {
    const sort = _.mapKeys(sortBy, (val, key) =>
      key.replace('date.', 'dates.')
    );
    agg.sort(sort);
  }

  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  if (populate.includes('artists')) {
    agg.lookup({
      from: 'artists',
      foreignField: '_id',
      localField: 'artists',
      as: 'artists',
    });
  }
  if (populate.includes('date.artists')) {
    agg.lookup({
      from: 'artists',
      foreignField: '_id',
      localField: 'date.artists',
      as: 'date.artists',
    });
  }
  if (populate.includes('images')) {
    agg.lookup({
      from: 'images',
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
    project.dates = 0;
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

async function uploadEventImage(eventId, { buffer, mime, extraData }) {
  const event = await Event.findById(eventId).exec();
  if (!event) {
    throw new NotFoundError('event_not_found');
  }

  const image = await imageRepository.uploadImage({
    buffer,
    mime,
    extraData,
  });

  event.images.push(image._id);
  await event.save();

  return image;
}

async function uploadEventImageByUrl(eventId, imageData) {
  const event = await Event.findById(eventId).exec();
  if (!event) {
    throw new NotFoundError('event_not_found');
  }

  const image = await imageRepository.uploadImageByUrl(imageData);

  event.images.push(image._id);
  await event.save();

  return image;
}

async function deleteEventImageById(eventId, imageId) {
  await imageRepository.deleteImageById(imageId);

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
