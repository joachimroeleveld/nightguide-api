const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_DOORPOLICIES,
  VENUE_PRICE_CLASSES,
  PAYMENT_METHODS,
} = require('../../../shared/constants');

const TEST_VENUE_1 = Object.freeze({
  _id: '5c001cac8e84e1067f34695c',
  sourceId: 1,
  name: 'Tivoli',
  description: {
    en: 'Tivoli Vredenburg.',
  },
  category: VENUE_CATEGORIES.CATEGORY_LOUNGE,
  location: {
    address: 'Vechtplantsoen 56-1',
    postalCode: '3554TG',
    city: 'Utrecht',
    country: COUNTRIES.COUNTRY_NL,
    coordinates: {
      type: 'Point',
      coordinates: [-122.5, 37.7],
    },
  },
  website: 'https://www.tivolivredenburg.nl',
  facebook: {
    pageUrl: 'https://www.facebook.com/TivoliVredenburgUtrecht/',
  },
  // doorPolicy: {
  //   policy: VENUE_DOORPOLICIES.POLICY_MODERATE,
  //   notes: 'Moderately strict',
  // },
  // prices: {
  //   class: VENUE_PRICE_CLASSES.CLASS_1,
  // },
  // vip: {
  //   hasVipArea: true,
  // },
  // smoking: {
  //   hasSmokingArea: true,
  // },
  // timeline: {
  //   dineFrom: '18:00',
  //   dineUntil: '20:00',
  //   bitesUntil: '22:00',
  //   drinkFrom: '21:00',
  //   partyFrom: '23:00',
  // },
  // kitchen: {
  //   openUntil: '21:00',
  //   bitesUntil: '23:00',
  // },
  // wardrobe: {
  //   hasSecuredWardrobe: true,
  // },
  // outdoorSeating: {
  //   hasOutdoorSeating: false,
  //   hasHeaters: false,
  // },
  // capacity: {
  //   amount: 3000,
  // },
  // payment: {
  //   methods: [PAYMENT_METHODS.METHOD_CASH],
  // },
  // entranceFee: {
  //   charge: 5,
  // },
  // parking: {
  //   hasParking: true,
  // },
});

const TEST_VENUE_2 = Object.freeze({
  ...TEST_VENUE_1,
  _id: '5c0261a0801b80bed2f047dd',
  sourceId: 2,
});

module.exports = {
  TEST_VENUE_1,
  TEST_VENUE_2,
};
