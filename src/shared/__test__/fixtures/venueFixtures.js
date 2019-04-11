const { VENUE_CATEGORIES, COUNTRIES } = require('../../../shared/constants');

const COORDINATES_UTRECHT = [5.085487, 52.118273];
const COORDINATES_WOERDEN = [4.873716, 52.083686];
const COORDINATES_THE_HAGUE = [4.282958, 52.072532];

const TEST_VENUE_1 = Object.freeze({
  _id: '5c001cac8e84e1067f34695c',
  sourceId: 1,
  name: 'Tivoli',
  location: {
    city: 'Utrecht',
    country: COUNTRIES.COUNTRY_NL,
    coordinates: {
      type: 'Point',
      coordinates: COORDINATES_UTRECHT,
    },
  },
});

const TEST_VENUE_2 = Object.freeze({
  ...TEST_VENUE_1,
  _id: '5c0261a0801b80bed2f047dd',
  categories: [VENUE_CATEGORIES.CATEGORY_CLUB],
  sourceId: 2,
});

const TEST_VENUE_3 = Object.freeze({
  ...TEST_VENUE_1,
  _id: '5c0261a0801b80bed2f047de',
  categories: [VENUE_CATEGORIES.CATEGORY_CLUB],
  sourceId: 3,
});

const TEST_VENUE_TIMESCHEDULE = {
  open: {
    mon: null,
    tue: {
      from: 0,
      to: 3600,
    },
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  kitchen: {
    mon: null,
    tue: {
      from: 0,
      to: 3600,
    },
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  terrace: {
    mon: null,
    tue: {
      from: 0,
      to: 3600,
    },
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  bitesUntil: {
    mon: null,
    tue: 3600,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  drinksFrom: {
    mon: null,
    tue: 3600,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  busyFrom: {
    mon: null,
    tue: 3600,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
  dancingFrom: {
    mon: null,
    tue: 3600,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
  },
};

module.exports = {
  TEST_VENUE_1,
  TEST_VENUE_2,
  TEST_VENUE_3,
  COORDINATES_UTRECHT,
  COORDINATES_THE_HAGUE,
  COORDINATES_WOERDEN,
  TEST_VENUE_TIMESCHEDULE,
};
