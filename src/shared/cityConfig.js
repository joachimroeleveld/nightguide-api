const config = {
  'nl/amsterdam': {
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
  },
  'nl/utrecht': {
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
    priceClassRanges: {
      coke: [0, 2.3, 2.8, 3.3],
      beer: [0, 2.4, 3, 3.6],
    },
    entranceFeeRanges: [0, 10, 20, 40],
  },
  'es/ibiza': {
    timezone: 'Europe/Madrid',
    currency: 'EUR',
  },
  'es/madrid': {
    timezone: 'Europe/Madrid',
    currency: 'EUR',
  },
};

module.exports = config;
