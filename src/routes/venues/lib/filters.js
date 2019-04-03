const moment = require('moment');

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
function applyFilterOnQuery(
  query,
  {
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
  }
) {
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
    query.where('location.country', country);
  }
  if (city) {
    query.where('location.city', city);
  }
  if (cat) {
    query.where('categories', cat);
  }
  if (musicType) {
    query.where('musicTypes', musicType);
  }
  if (visitorType) {
    query.where('visitorTypes', visitorType);
  }
  if (dresscode) {
    query.where('dresscode', dresscode);
  }
  if (paymentMethod) {
    query.where('paymentMethods', paymentMethod);
  }
  if (doorPolicy) {
    query.where('doorPolicy.policy', doorPolicy);
  }

  if (capRange) {
    applyCapRangeFilter(query, capRange);
  }
  if (priceClass) {
    applyPriceClassFilter(query, priceClass, cityConf);
  }

  if (noEntranceFee !== undefined) {
    query.where({
      $or: [{ 'fees.entrance': 0 }, { 'fees.entrance': { $exists: false } }],
    });
  }
  if (noCoatCheckFee !== undefined) {
    query.where({
      $or: [{ 'fees.coatCheck': 0 }, { 'fees.coatCheck': { $exists: false } }],
    });
  }
  if (noBouncers !== undefined) {
    query.where({
      facilities: { $ne: VENUE_FACILITIES.FACILITY_BOUNCERS },
    });
  }

  if (openTime) {
    applyTimeScheduleFilter(query, 'open', openTime, true);
  }
  if (terraceTime) {
    applyTimeScheduleFilter(query, 'terrace', terraceTime, true);
  }
  if (busyTime) {
    applyTimeScheduleFilter(query, 'busyFrom', busyTime);
  }
  if (dancingTime) {
    applyTimeScheduleFilter(query, 'dancingFrom', dancingTime);
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
  Object.keys(facilityFilterMap)
    .filter(facility => facilityFilterMap[facility] !== undefined)
    .forEach(facility => query.where({ facilities: facility }));

  return query;
}

function applyPriceClassFilter(query, priceClass, cityConfig) {
  priceClass = parseInt(priceClass);
  if (
    !priceClass ||
    priceClass < 1 ||
    priceClass < VENUE_CAPACITY_RANGES.length
  ) {
    throw new InvalidArgumentError(
      'invalid_price_class',
      'Filter priceClass is invalid'
    );
  }
  const orQuery = [];
  const lowerBoundBeer = cityConfig.priceClassRanges.beer[priceClass - 1];
  const upperBoundBeer = cityConfig.priceClassRanges.beer[priceClass];
  orQuery.push({
    'prices.beer': { $gt: lowerBoundBeer, $lte: upperBoundBeer },
  });
  const lowerBoundCoke = cityConfig.priceClassRanges.coke[priceClass - 1];
  const upperBoundCoke = cityConfig.priceClassRanges.coke[priceClass];
  orQuery.push({
    'prices.coke': { $gt: lowerBoundCoke, $lte: upperBoundCoke },
  });
  query.where({
    $or: orQuery,
  });
}

function applyCapRangeFilter(query, capRange) {
  capRange = parseInt(capRange);
  if (!capRange || capRange < 1 || capRange > VENUE_CAPACITY_RANGES.length) {
    throw new InvalidArgumentError(
      'invalid_filter',
      'Filter capRange is invalid'
    );
  }
  const capLowerBound = VENUE_CAPACITY_RANGES[capRange - 1];
  const capUpperBound = VENUE_CAPACITY_RANGES[capRange];
  const capWhere = {
    $gte: capLowerBound,
  };
  if (VENUE_CAPACITY_RANGES[capRange]) {
    capWhere.$lt = capUpperBound;
  }
  query.where({
    capacity: capWhere,
  });
}

function applyTimeScheduleFilter(query, schedule, dateString, isRange = false) {
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
    query.where({
      [`${key}.from`]: { $lte: seconds },
      [`${key}.to`]: { $gt: seconds },
    });
  } else {
    query.where({
      [key]: { $lte: seconds },
    });
  }
}

module.exports = {
  applyFilterOnQuery,
};
