const unidecode = require('unidecode');
const _ = require('lodash');

const { PreconditionFailedError } = require('../../../shared/errors');

function createLocationFilterFromValues({ city, country }) {
  const filter = {};

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

  return _.isEmpty(filter) ? null : filter;
}

function createFilterFromValues({
  query: textFilter,
  venue,
  isFbEvent,
  dateFrom,
}) {
  const filter = {
    $and: [],
  };

  if (textFilter && textFilter.length >= 2) {
    filter.$text = { $search: unidecode(textFilter) };
  }

  if (dateFrom) {
    const afterFilter = new Date(dateFrom);
    filter.$and.push({
      $or: [
        { 'dates.from': { $gt: afterFilter } },
        { 'dates.to': { $gt: afterFilter } },
      ],
    });
  }

  if (venue) {
    filter['organiser.venue'] = venue;
  }
  if (isFbEvent) {
    filter['facebook.id'] = { $exists: true };
  }

  if (!filter.$and.length) {
    delete filter.$and;
  }

  return _.isEmpty(filter) ? null : filter;
}

module.exports = {
  createLocationFilterFromValues,
  createFilterFromValues,
};
