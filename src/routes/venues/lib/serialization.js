const _ = require('lodash');

const { VENUE_CAPACITY_RANGES } = require('../../../shared/constants');
const cityConfig = require('../../../shared/cityConfig');
const VenueImage = require('../venueImageModel');

function serialize(data) {
  if (data.location && data.location.coordinates) {
    data.location.coordinates = {
      type: 'Point',
      coordinates: [
        data.location.coordinates.longitude,
        data.location.coordinates.latitude,
      ],
    };
  }
  return data;
}

function deserialize(venue) {
  if (venue.toObject) {
    venue = venue.toObject();
  } else {
    venue = _.cloneDeep(venue);
  }

  venue.id = venue._id;
  delete venue._id;
  delete venue.__v;
  delete venue.sourceId;

  if (venue.images) {
    venue.images = venue.images.map(VenueImage.deserialize);
  }

  if (venue.location && venue.location.coordinates) {
    const longitude = venue.location.coordinates.coordinates[0];
    const latitude = venue.location.coordinates.coordinates[1];
    venue.location.coordinates = {
      longitude,
      latitude,
    };
  }

  if (venue.capacity) {
    const capacityRange = getCapacityRange(venue);
    if (capacityRange.length === 2) {
      venue.capacityRange = `${capacityRange[0]}-${capacityRange[1]}`;
    } else {
      venue.capacityRange = `10.000+`;
    }
  }

  if (venue.prices) {
    venue.priceClass = getPriceClass(venue);
  }

  return venue;
}

function getPriceClass(venue) {
  if (
    (!venue.prices.coke && !venue.prices.beer) ||
    !venue.location ||
    !venue.location.city ||
    !venue.location.country
  ) {
    return null;
  }

  const city = cityConfig.get(venue.location.country, venue.location.city);
  const getClassForRanges = ranges =>
    ranges.reduce((range, lowerBound, index) => {
      if (range) {
        return range;
      }
      const upperBound = ranges[index + 1];
      if (
        !upperBound ||
        (venue.prices.coke > lowerBound && venue.prices.coke <= upperBound)
      ) {
        return index + 1;
      }
    }, null);

  const cokeClass = getClassForRanges(city.priceClassRanges.coke);
  const beerClass = getClassForRanges(city.priceClassRanges.beer);
  return Math.max(cokeClass, beerClass);
}

function getCapacityRange(venue) {
  if (!venue.capacity) {
    return null;
  }

  return VENUE_CAPACITY_RANGES.reduce((range, lowerBound, index) => {
    if (range) {
      return range;
    }
    const upperBound = VENUE_CAPACITY_RANGES[index + 1];
    if (!upperBound) {
      return lowerBound;
    }
    if (venue.capacity > lowerBound && venue.capacity <= upperBound) {
      return [lowerBound, upperBound];
    }
  }, null);
}

module.exports = {
  serialize,
  deserialize,
  getPriceClass,
  getCapacityRange,
};
