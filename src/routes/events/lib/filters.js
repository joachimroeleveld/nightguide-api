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

function createFilterFromValues({ query: textFilter }) {
  const filter = {
    $and: [],
  };

  if (textFilter && textFilter.length >= 2) {
    filter.queryText = new RegExp(`\\b${unidecode(textFilter)}`, 'i');
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
