const moment = require('moment');
const _ = require('lodash');
const unidecode = require('unidecode');

const {
  VENUE_CAPACITY_RANGES,
  VENUE_FACILITIES,
} = require('../../../shared/constants');
const {
  InvalidArgumentError,
  PreconditionFailedError,
} = require('../../../shared/errors');
const cityConfig = require('../../../shared/cityConfig');
const { validateDateTimeIso8601 } = require('../../../shared/util/validate');

// TODO: do validation in OpenAPI spec (not supported yet)
function createFilterFromValues({
  query: textFilter,
  city,
  country,
  cat,
  dancingTime,
  openTime,
  busyTime,
  terraceTime,
  priceClass,
  musicType,
  visitorType,
  dresscode,
  paymentMethod,
  doorPolicy,
  capRange,
  bouncers,
  noBouncers,
  parking,
  accessible,
  vipArea,
  noEntranceFee,
  kitchen,
  coatCheck,
  noCoatCheckFee,
  smokingArea,
  cigarettes,
  terrace,
  terraceHeaters,
}) {
  const filter = { $and: [] };

  if (textFilter && textFilter.length >= 2) {
    filter.queryText = new RegExp(`\\b${unidecode(textFilter)}`, 'i');
  }

  let cityConf;
  // Check preconditions
  if (priceClass) {
    cityConf = cityConfig.get(country, city);
    if (!cityConf) {
      throw new PreconditionFailedError(
        'invalid_location',
        'Invalid country or city argument'
      );
    }
  }

  if (country) {
    filter['location.country'] = country;
  }
  if (city) {
    filter['location.city'] = city;
  }
  if (cat) {
    filter.categories = { $in: cat };
  }
  if (musicType) {
    filter.musicTypes = { $in: musicType };
  }
  if (visitorType) {
    filter.visitorTypes = { $in: visitorType };
  }
  if (dresscode) {
    filter.dresscode = dresscode;
  }
  if (paymentMethod) {
    filter.paymentMethods = { $all: paymentMethod };
  }
  if (doorPolicy) {
    if (doorPolicy !== 'none') {
      filter['doorPolicy.policy'] = doorPolicy;
    } else {
      filter['doorPolicy.policy'] = { $exists: false };
    }
  }

  if (capRange) {
    _.mergeWith(filter, getCapRangeFilter(capRange), queryMerger);
  }
  if (priceClass) {
    _.mergeWith(filter, getPriceClassFilter(priceClass, cityConf), queryMerger);
  }

  if (noEntranceFee !== undefined) {
    filter.$and.push({
      $or: [{ 'fees.entrance': 0 }, { 'fees.entrance': { $exists: false } }],
    });
  }
  if (noCoatCheckFee !== undefined) {
    filter.$and.push({
      $or: [{ 'fees.coatCheck': 0 }, { 'fees.coatCheck': { $exists: false } }],
    });
  }
  if (noBouncers !== undefined) {
    filter.$and.push({
      facilities: { $nin: [VENUE_FACILITIES.FACILITY_BOUNCERS] },
    });
  }

  if (openTime) {
    _.mergeWith(
      filter,
      getTimeScheduleFilter('open', openTime, true),
      queryMerger
    );
  }
  if (terraceTime) {
    _.mergeWith(
      filter,
      getTimeScheduleFilter('terrace', terraceTime, true),
      queryMerger
    );
  }
  if (busyTime) {
    _.mergeWith(
      filter,
      getTimeScheduleFilter('busyFrom', busyTime),
      queryMerger
    );
  }
  if (dancingTime) {
    _.mergeWith(
      filter,
      getTimeScheduleFilter('dancingFrom', dancingTime),
      queryMerger
    );
  }

  const facilityFilterMap = {
    [VENUE_FACILITIES.FACILITY_VIP]: vipArea,
    [VENUE_FACILITIES.FACILITY_SMOKING_AREA]: smokingArea,
    [VENUE_FACILITIES.FACILITY_TERRACE]: terrace,
    [VENUE_FACILITIES.FACILITY_TERRACE_HEATERS]: terraceHeaters,
    [VENUE_FACILITIES.FACILITY_BOUNCERS]: bouncers,
    [VENUE_FACILITIES.FACILITY_KITCHEN]: kitchen,
    [VENUE_FACILITIES.FACILITY_COAT_CHECK]: coatCheck,
    [VENUE_FACILITIES.FACILITY_PARKING]: parking,
    [VENUE_FACILITIES.FACILITY_CIGARETTES]: cigarettes,
    [VENUE_FACILITIES.FACILITY_ACCESSIBLE]: accessible,
  };
  const facilities = Object.keys(facilityFilterMap).filter(
    facility => facilityFilterMap[facility] !== undefined
  );
  if (facilities.length) {
    filter.$and.push({ facilities: { $all: facilities } });
  }

  if (!filter.$and.length) {
    delete filter.$and;
  }

  return filter;
}

function getPriceClassFilter(priceClass, cityConfig) {
  priceClass = parseInt(priceClass);
  if (
    !priceClass ||
    priceClass < 1 ||
    priceClass > cityConfig.priceClassRanges.length
  ) {
    throw new InvalidArgumentError(
      'invalid_price_class',
      'Filter priceClass is invalid'
    );
  }
  const orFilter = [];
  const lowerBoundBeer = cityConfig.priceClassRanges.beer[priceClass - 1];
  const upperBoundBeer = cityConfig.priceClassRanges.beer[priceClass];
  orFilter.push({
    'prices.beer': { $gt: lowerBoundBeer, $lte: upperBoundBeer },
  });
  const lowerBoundCoke = cityConfig.priceClassRanges.coke[priceClass - 1];
  const upperBoundCoke = cityConfig.priceClassRanges.coke[priceClass];
  orFilter.push({
    'prices.coke': { $gt: lowerBoundCoke, $lte: upperBoundCoke },
  });
  return {
    $and: [{ $or: orFilter }],
  };
}

function getCapRangeFilter(capRange) {
  capRange = parseInt(capRange);
  if (!capRange || capRange < 1 || capRange > VENUE_CAPACITY_RANGES.length) {
    throw new InvalidArgumentError(
      'invalid_filter',
      'Filter capRange is invalid'
    );
  }
  const capLowerBound = VENUE_CAPACITY_RANGES[capRange - 1];
  const capUpperBound = VENUE_CAPACITY_RANGES[capRange];
  const capFilter = {
    $gte: capLowerBound,
  };
  if (VENUE_CAPACITY_RANGES[capRange]) {
    capFilter.$lt = capUpperBound;
  }
  return {
    capacity: capFilter,
  };
}

function getTimeScheduleFilter(schedule, dateString, isRange = false) {
  if (!validateDateTimeIso8601(dateString)) {
    throw new InvalidArgumentError(`invalid_schedule_${schedule}`);
  }
  const momentObj = moment(dateString).utc();
  const dayKey = momentObj
    .locale('en')
    .format('ddd')
    .toLowerCase();
  const seconds =
    momentObj.hours() * 3600 + momentObj.minutes() * 60 + momentObj.seconds();
  const key = `timeSchedule.${schedule}.${dayKey}`;
  if (isRange) {
    return {
      [`${key}.from`]: { $lte: seconds },
      [`${key}.to`]: { $gt: seconds },
    };
  } else {
    return {
      [key]: { $lte: seconds },
    };
  }
}

function queryMerger(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

module.exports = {
  createFilterFromValues,
};
