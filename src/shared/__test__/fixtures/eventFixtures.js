const { COORDINATES_UTRECHT } = require('./locationFixtures');
const { deepFreeze } = require('../../util/objects');

const TEST_EVENT_1 = deepFreeze({
  _id: '5cab012f2830a46462316889',
  title: 'Bevrijdingsfestival',
  dates: [
    {
      _id: '5d2861d4314defa5a500e11c',
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
  pageSlug: 'nl/utrecht',
});

const TEST_EVENT_2 = deepFreeze({
  ...TEST_EVENT_1,
  _id: '5cab1b4c56e3d06b5f732676',
  dates: [
    {
      _id: '5d19f6824697baeac21cbed2',
      from: new Date('2017-12-11T11:16:14.157Z'),
      to: new Date('2017-09-12T11:16:14.157Z'),
    },
  ],
  title: 'Bingo',
});

const TEST_FACEBOOK_EVENT_1 = deepFreeze({
  _id: '5d2862c69c9f05a5fc25b3c7',
  dates: [
    {
      _id: '5d19f6824697baeac21cbee1',
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
    venue: '5cdaa0b1f22f40bdba5ca3f3',
  },
  facebook: {
    id: '12345678',
  },
  pageSlug: 'nl/utrecht',
});

const TEST_FACEBOOK_EVENT_2 = deepFreeze({
  ...TEST_FACEBOOK_EVENT_1,
  _id: '5cab012f2830a46462316881',
  dates: [
    {
      _id: '5d19f08392e71d392c5ddba1',
      from: new Date('2017-12-11T11:16:14.157Z'),
      to: new Date('2017-09-12T11:16:14.157Z'),
    },
  ],
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
