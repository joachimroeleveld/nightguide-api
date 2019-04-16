const unidecode = require('unidecode');
const _ = require('lodash');

const { NotFoundError } = require('../../../shared/errors');
const venueRepository = require('../../venues/venueRepository');
const EventImage = require('../eventImageModel');

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
    event.images = event.images.map(EventImage.deserialize);
  }

  if (event.date) {
    if (event.date.from) {
      event.date.from = event.date.from.toISOString();
    }
    if (event.date.to) {
      event.date.to = event.date.to.toISOString();
    }
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
  if (!event.queryText) {
    event.queryText = unidecode(event.title);
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

module.exports = {
  deserialize,
  serialize,
};
