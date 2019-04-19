const unidecode = require('unidecode');
const _ = require('lodash');

const { NotFoundError } = require('../../../shared/errors');
const venueRepository = require('../../venues/venueRepository');

/**
 * Prepare event object to be sent to client.
 * @returns {Event}
 */
function deserialize(event) {
  if (event.toObject) {
    event = event.toObject();
  } else {
    event = _.cloneDeep(event);
  }

  event.id = event._id;
  delete event._id;
  delete event.__v;
  delete event.queryText;

  if (event.images) {
    event.images = event.images.map(deserializeImage);
  }

  if (event.dates) {
    event.dates = event.dates.map(date => ({
      from: date.from.toISOString(),
      to: date.to.toISOString(),
    }));
  }

  if (event.location && event.location.coordinates) {
    const longitude = event.location.coordinates.coordinates[0];
    const latitude = event.location.coordinates.coordinates[1];
    event.location.coordinates = {
      longitude,
      latitude,
    };
  }

  return event;
}

/**
 * Prepare event object for database insertion.
 * @param event
 */
async function serialize(event) {
  if (event.id) {
    event._id = event.id;
    delete event.id;
  }

  if (!event.queryText) {
    event.queryText = unidecode(
      event.title || _.get(event, 'facebook.title') || ''
    );
  }

  if (event.location && event.location.coordinates) {
    event.location.coordinates = {
      type: 'Point',
      coordinates: [
        event.location.coordinates.longitude,
        event.location.coordinates.latitude,
      ],
    };
  }

  // Fetch location from venue
  if (
    event.location &&
    event.location.type === 'venue' &&
    event.organiser &&
    event.organiser.type === 'venue' &&
    event.organiser.venue
  ) {
    const venue = await venueRepository.getVenue(event.organiser.venue, {
      fields: ['location'],
    });
    if (!venue) {
      throw NotFoundError('venue_not_found');
    }
    event.location = {
      type: 'venue',
      ...venue.toObject().location,
    };
  }

  return event;
}

function deserializeImage(image) {
  if (image.toObject) {
    image = image.toObject();
  } else {
    image = _.cloneDeep(image);
  }

  image.id = image._id;
  delete image._id;
  delete image.__v;

  return image;
}

module.exports = {
  deserialize,
  serialize,
  deserializeImage,
};
