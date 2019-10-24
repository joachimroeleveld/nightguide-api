const _ = require('lodash');
const uuidv4 = require('uuid/v4');

const config = require('../../shared/config');
const {
  InvalidArgumentError,
  NotFoundError,
  PreconditionFailedError,
} = require('../../shared/errors');
const imageRepository = require('../images/imageRepository');
const ticketCodesTemplate = require('../../shared/templates/pdf/ticket-codes');
const storage = require('../../shared/services/storage');
const Venue = require('./venueModel');
const { serialize, deserialize } = require('./lib/serialization');
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

async function uploadVenueImage(venueId, { buffer, mime, extraData }) {
  const venue = await Venue.findById(venueId).exec();
  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  const image = await imageRepository.uploadImage({
    buffer,
    mime,
    extraData,
  });

  venue.images.push(image._id);
  await venue.save();

  return image;
}

async function uploadVenueImageByUrl(venueId, imageData) {
  const venue = await Venue.findById(venueId).exec();
  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  const image = await imageRepository.uploadImageByUrl(imageData);

  venue.images.push(image._id);
  await venue.save();

  return image;
}

async function deleteVenueImageById(venueId, imageId) {
  await imageRepository.deleteImageById(imageId);

  await Venue.findByIdAndUpdate(venueId, {
    $pull: { images: imageId },
  }).exec();
}

async function generateVenueTicketCodes(venueId) {
  const codes = [];
  for (let l = 0; l < 26; l++) {
    const letter = String.fromCharCode(97 + l).toUpperCase();
    for (let i = 0; i < 10; i++) {
      const rest = Math.random()
        .toString(36)
        .substr(2, 5);
      codes.push(letter + rest.toUpperCase());
    }
  }
  codes.reverse();

  const venue = await Venue.findByIdAndUpdate(
    venueId,
    {
      $set: { 'tickets.codes': codes },
    },
    { new: true }
  ).exec();

  if (!venue) {
    throw new NotFoundError('venue_not_found');
  }

  return venue.tickets.codes;
}

async function generateVenueTicketCodesPdfUrl(venueId) {
  const venue = await getVenue(venueId);

  const codes = _.get(venue, 'tickets.codes');
  if (!codes || !codes.length) {
    throw new PreconditionFailedError('venue_without_ticket_codes');
  }

  const pdfStream = await ticketCodesTemplate.render({ codes });

  const bucketName = config.get('BUCKET_TICKET_CODES');
  const bucket = storage.bucket(bucketName);

  const fileName = `${venueId}/${uuidv4()}.pdf`;
  const file = bucket.file(fileName);

  const save = file.createWriteStream({
    metadata: {
      contentType: 'application/pdf',
    },
  });
  pdfStream.pipe(save);

  return new Promise((resolve, reject) => {
    save.on('error', reject);
    save.on('finish', async () => {
      await file.makePublic();
      const pdfUrl = `https://storage.cloud.google.com/${bucketName}/${fileName}`;

      try {
        await updateVenue(venueId, {
          $set: { 'tickets.pdfUrl': pdfUrl },
        });

        resolve(pdfUrl);
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function redeemVenueTicketCode(venueId) {
  const venue = await getVenue(venueId);

  const codes = _.get(venue, 'tickets.codes');
  if (!codes || !codes.length) {
    throw new PreconditionFailedError('venue_without_ticket_codes');
  }

  const code = venue.tickets.codes.pop();

  await venue.save();

  return code;
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
  deleteVenueImageById,
  generateVenueTicketCodes,
  redeemVenueTicketCode,
  generateVenueTicketCodesPdfUrl,
};
