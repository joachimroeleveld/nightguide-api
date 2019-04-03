const config = {
  NL: {
    Utrecht: {
      priceClassRanges: {
        coke: [0, 2.3, 2.8, 3.3],
        beer: [0, 2.4, 3, 3.6],
      },
      entranceFeeRanges: [0, 10, 20, 40],
    },
  },
};

module.exports = {
  get: (country, city) =>
    config[country] && config[country][city] ? config[country][city] : null,
};
