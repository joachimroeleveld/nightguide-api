const request = require('request-promise-native');
const imgSize = require('image-size');
const mimeTypes = require('mime-types');
const _ = require('lodash');
const unidecode = require('unidecode');
const mongoose = require('mongoose');

const imagesService = require('../../shared/services/images');
const { InvalidArgumentError, NotFoundError } = require('../../shared/errors');
const Event = require('./eventModel');
const EventImage = require('./eventImageModel');
const {
  serialize,
  deserialize,
  deserializeImage,
} = require('./lib/serialization');
const { getNextDateFieldExpr } = require('./lib/aggregation');

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

async function getEvents(opts, withCount = false) {
  const {
    populate = [],
    fields = [],
    offset,
    limit,
    sortBy,
    textFilter,
    isFbEvent,
    dateFrom,
    venueId,
    country,
    city,
    ids,
  } = opts;
  const match = agg => {
    const match = {};
    // Text filter must be first in aggregration pipeline
    if (textFilter && textFilter.length >= 2) {
      match.$text = { $search: unidecode(textFilter) };
    }
    if (ids) {
      const objectIds = ids.map(id => mongoose.Types.ObjectId(id));
      match['_id'] = { $in: objectIds };
    }
    if (city) {
      match['location.city'] = city;
    }
    if (country) {
      match['location.country'] = country;
    }
    if (venueId) {
      match['organiser.venue'] = venueId.toString();
    }
    if (isFbEvent) {
      match['facebook.id'] = { $exists: true };
    }
    agg.match(match);

    if (dateFrom) {
      agg.addFields({
        nextDate: getNextDateFieldExpr(new Date(dateFrom)),
      });
      agg.match({
        nextDate: { $ne: null },
      });
      agg.project('-nextDate');
    }

    return agg;
  };

  const agg = match(Event.aggregate());

  let countAgg;
  if (withCount) {
    countAgg = match(Event.aggregate());
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
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

  const results = await agg.exec();

  if (populate.length) {
    for (const path in populate) {
      await Event.populate(results, { path: populate }).exec();
    }
  }

  if (withCount) {
    const countResult = await countAgg.exec();
    const count = (countResult.length && countResult[0].totalCount) || 0;
    return { totalCount: count, results };
  } else {
    return results;
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
  updateEvent,
  uploadEventImage,
  uploadEventImageByUrl,
  deleteEvents,
  deleteEventImageById,
  serialize,
  deserialize,
  deserializeImage,
};
