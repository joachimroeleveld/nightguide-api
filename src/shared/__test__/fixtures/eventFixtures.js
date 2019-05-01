const { COORDINATES_UTRECHT } = require('./locationFixtures');

const TEST_EVENT_1 = Object.freeze({
  _id: '5cab012f2830a46462316889',
  title: 'Bevrijdingsfestival',
  dates: [
    {
      from: new Date('2019-12-11T11:16:14.157Z'),
      to: new Date('2019-09-12T11:16:14.157Z'),
    },
  ],
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

const TEST_FACEBOOK_EVENT_1 = Object.freeze({
  _id: '5cab012f2830a46462316880',
  dates: [
    {
      from: new Date('2019-12-11T11:16:14.157Z'),
      to: new Date('2019-09-12T11:16:14.157Z'),
    },
  ],
  location: {
    type: 'venue',
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
  organiser: {
    type: 'venue',
    venue: 'foo',
  },
  facebook: {
    id: '12345678',
  },
});

const TEST_FACEBOOK_EVENT_2 = Object.freeze({
  ...TEST_FACEBOOK_EVENT_1,
  _id: '5cab012f2830a46462316881',
  facebook: {
    ...TEST_FACEBOOK_EVENT_1.facebook,
    id: 'abcdefgh',
  },
});

module.exports = {
  TEST_EVENT_1,
  TEST_EVENT_2,
  TEST_FACEBOOK_EVENT_1,
  TEST_FACEBOOK_EVENT_2,
};
