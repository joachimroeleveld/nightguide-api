const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_DOORPOLICIES,
  VENUE_PRICE_CLASSES,
  VENUE_PAYMENT_METHODS,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
} = require('../../../shared/constants');

const COORDINATES_UTRECHT = [5.085487, 52.118273];
const COORDINATES_WOERDEN = [4.873716, 52.083686];
const COORDINATES_THE_HAGUE = [4.282958, 52.072532];

const TEST_VENUE_1 = Object.freeze({
  _id: '5c001cac8e84e1067f34695c',
  sourceId: 1,
  name: 'Tivoli',
  categories: [VENUE_CATEGORIES.CATEGORY_BAR],
  description: {
    en: 'Tivoli Vredenburg.',
  },
  location: {
    address1: 'Vechtplantsoen 56',
    address2: '1',
    postalCode: '3554TG',
    city: 'Utrecht',
    country: COUNTRIES.COUNTRY_NL,
    coordinates: {
      type: 'Point',
      coordinates: COORDINATES_UTRECHT,
    },
  },
  website: 'https://www.tivolivredenburg.nl',
  facebook: {
    id: 'TivoliVredenburgUtrecht',
  },
  instagram: {
    id: 'tivolivredenburg',
  },
  twitterHandle: 'TiVredenburg',
  musicTypes: [VENUE_MUSIC_TYPES.MUSIC_DANCE],
  visitorTypes: [VENUE_VISITOR_TYPES.VISITOR_STUDENT],
});

const TEST_VENUE_2 = Object.freeze({
  ...TEST_VENUE_1,
  _id: '5c0261a0801b80bed2f047dd',
  categories: [VENUE_CATEGORIES.CATEGORY_CLUB],
  sourceId: 2,
});

module.exports = {
  TEST_VENUE_1,
  TEST_VENUE_2,
  COORDINATES_UTRECHT,
  COORDINATES_THE_HAGUE,
  COORDINATES_WOERDEN,
};
