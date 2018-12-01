const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_DOORPOLICIES,
  VENUE_PRICE_CLASSES,
  PAYMENT_METHODS,
} = require('../../../shared/constants');

const TEST_VENUE_1 = Object.freeze({
  name: 'Tivoli',
  description: 'Tivoli Vredenburg.',
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
  contactInfo: {
    name: 'Bob van de Meer',
    emailAddress: 'bob@gmail.com',
    phone: '0623676279',
    notes: 'Contact info note',
  },
  website: 'https://www.tivolivredenburg.nl',
  facebook: {
    pageUrl: 'https://www.facebook.com/TivoliVredenburgUtrecht/',
  },
  doorPolicy: {
    policy: VENUE_DOORPOLICIES.POLICY_MODERATE,
    notes: 'Moderately strict',
  },
  prices: {
    class: VENUE_PRICE_CLASSES.CLASS_1,
  },
  vip: {
    hasVipArea: true,
  },
  smoking: {
    hasSmokingArea: true,
  },
  timeline: {
    dineFrom: '18:00',
    dineUntil: '20:00',
    bitesUntil: '22:00',
    drinkFrom: '21:00',
    partyFrom: '23:00',
  },
  kitchen: {
    openUntil: '21:00',
    bitesUntil: '23:00',
  },
  wardrobe: {
    hasSecuredWardrobe: true,
  },
  outdoorSeating: {
    hasOutdoorSeating: false,
    hasHeaters: false,
  },
  capacity: {
    amount: 3000,
  },
  payment: {
    methods: [PAYMENT_METHODS.METHOD_CASH],
  },
  entranceFee: {
    charge: 5,
  },
  parking: {
    hasParking: true,
  },
});

module.exports = {
  TEST_VENUE_1,
};
