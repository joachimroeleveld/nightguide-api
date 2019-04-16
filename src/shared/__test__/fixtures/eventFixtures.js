const { COORDINATES_UTRECHT } = require('./locationFixtures');

const TEST_EVENT_1 = Object.freeze({
  _id: '5cab012f2830a46462316889',
  title: 'Bevrijdingsfestival',
  date: {
    from: new Date(2019, 12, 11),
    to: new Date(2019, 9, 12),
  },
  location: {
    type: 'address',
    city: 'Utrecht',
    country: 'NL',
    address1: 'Vechtplantsoen 56',
    address2: '1',
    postalCode: '3554TG',
    coordinates: {
      type: 'Point',
      coordinates: COORDINATES_UTRECHT,
    },
  },
});

const TEST_EVENT_2 = Object.freeze({
  ...TEST_EVENT_1,
  _id: '5cab1b4c56e3d06b5f732676',
  title: 'Bingo',
});

module.exports = {
  TEST_EVENT_1,
  TEST_EVENT_2,
};
