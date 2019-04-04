const _ = require('lodash');

const { VENUE_CAPACITY_RANGES } = require('../../../shared/constants');
const cityConfig = require('../../../shared/cityConfig');
const VenueImage = require('../venueImageModel');

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

  // Set computed fields
  if (venue.location && venue.location.country && venue.location.city) {
    if (venue.capacity) {
      venue.capacityRange = getCapacityRange(venue);
    }
    if (venue.prices) {
      venue.priceClass = getPriceClass(venue);
    }
    if (venue.fees) {
      venue.currency = getCurrency(venue);
      if (venue.fees.entrance) {
        venue.entranceFeeRange = getEntranceFeeRange(venue);
      }
    }
  }

  return venue;
}

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

function getPriceClass(venue) {
  if (!venue.prices.coke && !venue.prices.beer) {
    return null;
  }

  const cityConf = cityConfig.get(venue.location.country, venue.location.city);
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

  const cokeClass = getClassForRanges(cityConf.priceClassRanges.coke);
  const beerClass = getClassForRanges(cityConf.priceClassRanges.beer);
  return Math.max(cokeClass, beerClass);
}

function getCurrency(venue) {
  const cityConf = cityConfig.get(venue.location.country, venue.location.city);
  return cityConf.currency;
}

function getEntranceFeeRange(venue) {
  const cityConf = cityConfig.get(venue.location.country, venue.location.city);
  return cityConf.entranceFeeRanges.reduce((range, lowerBound, index) => {
    if (range) {
      return range;
    }
    const upperBound = cityConf.entranceFeeRanges[index + 1];
    if (!upperBound) {
      return lowerBound;
    }
    if (venue.fees.entrance > lowerBound && venue.fees.entrance <= upperBound) {
      return [lowerBound, upperBound];
    }
  }, null);
}

function getCapacityRange(venue) {
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
  getCurrency,
  getCapacityRange,
  getEntranceFeeRange,
};
