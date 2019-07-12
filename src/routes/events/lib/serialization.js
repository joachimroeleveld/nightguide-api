const unidecode = require('unidecode');
const _ = require('lodash');

const { isPopulated } = require('../../../shared/util/mongooseUtils');
const { NotFoundError } = require('../../../shared/errors');
const venueRepository = require('../../venues/venueRepository');
const { deserializeTag } = require('../../tags/tagRepository');
const artistRepository = require('../../artists/artistRepository');

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
  delete event.queryText;

  if (isPopulated(event.images)) {
    event.images = event.images.map(deserializeImage);
  }
  if (isPopulated(event.tags)) {
    event.tags = event.tags.map(deserializeTag);
  }
  if (isPopulated(event.artists)) {
    event.artists = event.artists.map(artistRepository.deserialize);
  }
  if (
    event.organiser &&
    event.organiser.venue &&
    isPopulated(event.organiser.venue)
  ) {
    event.organiser.venue = venueRepository.deserialize(event.organiser.venue);
  }

  const serializeDate = date => {
    if (date._id) {
      date.id = date._id;
      delete date._id;
    }
    if (date.from) {
      date.from = date.from.toISOString();
    }
    if (date.to) {
      date.to = date.to.toISOString();
    }
    if (isPopulated(date.artists)) {
      date.artists = date.artists.map(artistRepository.deserialize);
    }
    return date;
  };

  if (event.dates) {
    event.dates = event.dates.map(serializeDate);
  }
  if (event.date) {
    event.date = serializeDate(event.date);
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
    event.organiser.venue
  ) {
    const venue = await venueRepository.getVenue(event.organiser.venue, {
      fields: ['location'],
    });
    if (!venue) {
      throw NotFoundError('venue_not_found');
    }
    event.pageSlug = venue.pageSlug;
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

  return image;
}

module.exports = {
  deserialize,
  serialize,
  deserializeImage,
};
