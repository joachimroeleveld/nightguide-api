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
  kitchenTime,
  busyTime,
  bitesTime,
  terraceTime,
  priceClass,
  musicType,
  visitorType,
  hasFb,
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
    if (!country) {
      throw new PreconditionFailedError(
        'missing_country',
        'To filter on city, country must be passed'
      );
    }
    filter['location.city'] = city;
  }
  if (cat) {
    filter.categories = { $in: cat };
  }
  if (hasFb) {
    filter['facebook.id'] = { $exists: true };
  }
  if (musicType) {
    filter.musicTypes = { $in: musicType };
  }
  if (visitorType) {
    filter.visitorTypes = { $in: visitorType };
  }
  if (paymentMethod) {
    filter.paymentMethods = { $in: paymentMethod };
  }

  if (doorPolicy) {
    const doorPolicyFilter = _.flatten([doorPolicy]).map(doorPolicy => ({
      'doorPolicy.policy':
        doorPolicy === 'none' ? { $exists: false } : doorPolicy,
    }));
    if (doorPolicyFilter.length) {
      filter.$and.push({ $or: doorPolicyFilter });
    }
  }

  if (dresscode) {
    const dressCodeFilter = _.flatten([dresscode]).map(dresscode => ({
      dresscode: dresscode === 'none' ? { $exists: false } : dresscode,
    }));
    if (dressCodeFilter.length) {
      filter.$and.push({ $or: dressCodeFilter });
    }
  }

  if (capRange) {
    const capFilters = _.flatten([capRange]).map(getCapRangeFilter);
    if (capFilters.length) {
      filter.$and.push({ $or: capFilters.map(capacity => ({ capacity })) });
    }
  }

  if (priceClass) {
    const priceClasses = _.flatten([priceClass]).map(priceClass => {
      priceClass = parseInt(priceClass);
      if (
        !priceClass ||
        priceClass < 1 ||
        priceClass > cityConf.priceClassRanges.length
      ) {
        throw new InvalidArgumentError(
          'invalid_price_class',
          'Filter priceClass is invalid'
        );
      }
      return priceClass;
    });
    if (priceClasses.length) {
      filter.$and.push({
        $or: priceClasses.map(priceClass => ({ priceClass })),
      });
    }
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
    _.mergeWith(filter, getTimeRangeFilter('open', openTime), queryMerger);
  }
  if (terraceTime) {
    _.mergeWith(
      filter,
      getTimeRangeFilter('terrace', terraceTime),
      queryMerger
    );
  }
  if (kitchenTime) {
    _.mergeWith(
      filter,
      getTimeRangeFilter('kitchen', kitchenTime),
      queryMerger
    );
  }
  if (busyTime) {
    const { dayKey, seconds } = parseDateString(busyTime);
    filter.$and.push(
      { [`timeSchedule.busyFrom.${dayKey}`]: { $lte: seconds } },
      { [`timeSchedule.open.${dayKey}.to`]: { $gt: seconds } }
    );
  }
  if (dancingTime) {
    const { dayKey, seconds } = parseDateString(dancingTime);
    filter.$and.push(
      { [`timeSchedule.dancingFrom.${dayKey}`]: { $lte: seconds } },
      { [`timeSchedule.open.${dayKey}.to`]: { $gt: seconds } }
    );
  }
  if (bitesTime) {
    const { dayKey, seconds } = parseDateString(bitesTime);
    filter.$and.push(
      { [`timeSchedule.open.${dayKey}.from`]: { $lte: seconds } },
      { [`timeSchedule.bitesUntil.${dayKey}`]: { $gt: seconds } }
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
  return capFilter;
}

function getTimeRangeFilter(schedule, dateString) {
  const { dayKey, seconds } = parseDateString(dateString);
  const key = `timeSchedule.${schedule}.${dayKey}`;
  return {
    [`${key}.from`]: { $lte: seconds },
    [`${key}.to`]: { $gt: seconds },
  };
}

function parseDateString(dateString) {
  if (!validateDateTimeIso8601(dateString)) {
    throw new InvalidArgumentError(`invalid_date`);
  }
  const momentObj = moment(dateString).utc();
  const dayKey = momentObj
    .locale('en')
    .format('ddd')
    .toLowerCase();
  const seconds =
    momentObj.hours() * 3600 + momentObj.minutes() * 60 + momentObj.seconds();
  return { dayKey, seconds };
}

function queryMerger(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

module.exports = {
  createFilterFromValues,
};
