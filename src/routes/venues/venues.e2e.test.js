require('../../shared/__test__/testBootstrap');

const moment = require('moment');
const fs = require('fs');
const nodeRequest = require('request-promise-native');
const request = require('supertest');
const sinon = require('sinon');
const _ = require('lodash');

const { validator } = require('../../shared/openapi');
const imagesService = require('../../shared/services/images');
const {
  TEST_TAG_1,
  TEST_TAG_2,
  TEST_VENUE_1,
  TEST_VENUE_2,
  TEST_VENUE_3,
  TEST_VENUE_TIMESCHEDULE,
  TEST_FACEBOOK_EVENT_1,
  TEST_FACEBOOK_EVENT_2,
  COORDINATES_THE_HAGUE,
  COORDINATES_WOERDEN,
  COORDINATES_UTRECHT,
} = require('../../shared/__test__/fixtures');
const {
  resetDb,
  setFixtureLocation,
} = require('../../shared/__test__/testUtils');
const venueRepository = require('./venueRepository');
const {
  VENUE_IMAGE_PERSPECTIVES,
  VENUE_CATEGORIES,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
  VENUE_DOORPOLICIES,
  VENUE_DRESSCODES,
  VENUE_PAYMENT_METHODS,
  VENUE_FACILITIES,
  COUNTRIES,
} = require('../../shared/constants');
const eventRepository = require('../events/eventRepository');
const tagRepository = require('../tags/tagRepository');
const IMAGE_FIXTURE_PATH = 'src/shared/__test__/fixtures/images/square.jpg';

const VENUE_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('venues e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /venues', () => {
    const validateResponse = validator.validateResponse('get', '/venues');

    it('happy path', async () => {
      await venueRepository.createVenue(TEST_VENUE_1);

      const res = await request(global.app).get('/venues');

      expect(res.status).toEqual(200);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        `
Object {
  "categories": Array [],
  "id": "5c001cac8e84e1067f34695c",
  "location": Object {
    "address1": "Vechtplantsoen 56",
    "city": "Utrecht",
    "coordinates": Object {
      "latitude": 52.118273,
      "longitude": 5.085487,
    },
    "country": "NL",
    "postalCode": "3554TG",
  },
  "name": "Tivoli",
  "pageSlug": "nl/utrecht",
}
`,
        VENUE_SNAPSHOT_MATCHER
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(venue1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should return only fields set in the fields parameter', async () => {
      await venueRepository.createVenue(TEST_VENUE_1);

      const res = await request(global.app)
        .get('/venues')
        .query({
          fields: ['name'],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results[0]).toMatchObject(
        _.pick(TEST_VENUE_1, ['id', 'name'])
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should filter results on name based on query parameter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        queryText: 'tobefiltered',
      });
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({
          query: 'tobefiltered',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('return a totalCount with each result', async () => {
      await venueRepository.createVenue(TEST_VENUE_1);
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({ limit: 1 });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should handle special characters in search queries', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        queryText: 'cafe',
      });
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({
          query: 'café',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should sort results based on distance if specified', async () => {
      await venueRepository.createVenue(
        setFixtureLocation(TEST_VENUE_1, COORDINATES_THE_HAGUE)
      );
      await venueRepository.createVenue(
        setFixtureLocation(TEST_VENUE_2, COORDINATES_WOERDEN)
      );

      const res = await request(global.app)
        .get('/venues')
        .query({
          sortBy: 'distance',
          latitude: COORDINATES_UTRECHT[0],
          longitude: COORDINATES_UTRECHT[1],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should throw if sorted by distance and no coordinates supplied', async () => {
      const res = await request(global.app)
        .get('/venues')
        .query({
          sortBy: 'distance',
        });

      expect(res.status).toEqual(400);
    });

    it('ids filter', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const venue2 = await venueRepository.createVenue(TEST_VENUE_2);
      await venueRepository.createVenue(TEST_VENUE_3);

      const ids = [venue1._id.toString(), venue2._id.toString()];

      const res = await request(global.app)
        .get('/venues')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id)).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('exclude filter', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const venue2 = await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({
          exclude: venue1._id.toString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(venue2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('city filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        location: { ...TEST_VENUE_1.location },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        location: { ...TEST_VENUE_2.location, city: 'bar' },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          city: TEST_VENUE_1.location.city,
          country: TEST_VENUE_1.location.country,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('pageSlug filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        pageSlug: 'nl/utrecht',
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        pageSlug: 'es/ibiza',
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          pageSlug: 'nl/utrecht',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('country filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        location: { ...TEST_VENUE_1.location, country: COUNTRIES.COUNTRY_NL },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        location: { ...TEST_VENUE_2.location, country: COUNTRIES.COUNTRY_BE },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          country: COUNTRIES.COUNTRY_NL,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('category filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        categories: [VENUE_CATEGORIES.CATEGORY_BAR],
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        categories: [VENUE_CATEGORIES.CATEGORY_STRIP_CLUB],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          cat: VENUE_CATEGORIES.CATEGORY_BAR,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('musicType filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        musicTypes: [VENUE_MUSIC_TYPES.MUSIC_APRES_SKI],
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        musicTypes: [VENUE_MUSIC_TYPES.MUSIC_80_90],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          musicType: VENUE_MUSIC_TYPES.MUSIC_APRES_SKI,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('paymentMethod filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        paymentMethods: [VENUE_PAYMENT_METHODS.METHOD_CASH],
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        paymentMethods: [VENUE_PAYMENT_METHODS.METHOD_CREDIT_CARD],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          paymentMethod: VENUE_PAYMENT_METHODS.METHOD_CASH,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('dresscode filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        dresscode: VENUE_DRESSCODES.DRESSCODE_ALTERNATIVE,
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        dresscode: VENUE_DRESSCODES.DRESSCODE_CHIQUE,
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          dresscode: VENUE_DRESSCODES.DRESSCODE_ALTERNATIVE,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('doorPolicy filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        doorPolicy: { policy: VENUE_DOORPOLICIES.POLICY_GUESTLIST },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        doorPolicy: { policy: VENUE_DOORPOLICIES.POLICY_MODERATE },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          doorPolicy: VENUE_DOORPOLICIES.POLICY_GUESTLIST,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('capRange filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        capacity: 100,
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        capacity: 1000000,
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          capRange: 2,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('visitorType filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        visitorTypes: [VENUE_VISITOR_TYPES.VISITOR_INTERNATIONAL],
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        visitorTypes: [VENUE_VISITOR_TYPES.VISITOR_LGBTQ],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          visitorType: VENUE_VISITOR_TYPES.VISITOR_LGBTQ,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('noEntranceFee filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        fees: { entrance: 1 },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        fees: { entrance: 0 },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          noEntranceFee: true,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('noCoatCheckFee filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        fees: { coatCheck: 1 },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        fees: { coatCheck: 0 },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          noCoatCheckFee: true,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('noBouncers filter', async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        facilities: [],
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        facilities: [VENUE_FACILITIES.FACILITY_BOUNCERS],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          noBouncers: true,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    // Range time filters
    ['open', 'terrace', 'kitchen'].forEach(filter => {
      it(`${filter} filter`, async () => {
        await venueRepository.createVenue({
          ...TEST_VENUE_1,
          timeSchedule: {
            [filter]: {
              wed: {
                from: 14 * 3600, // Wednesday 14:00
                to: 23 * 3600, // Wednesday 23:00
              },
            },
          },
        });
        await venueRepository.createVenue({
          ...TEST_VENUE_2,
          timeSchedule: {
            [filter]: {
              thu: {
                from: 14 * 3600, // Thursday 14:00
                to: 23 * 3600, // Thursday 23:00
              },
            },
          },
        });

        const res = await request(global.app)
          .get('/venues')
          .query({
            [`${filter}Time`]: moment()
              .utc()
              .day('wed')
              .hour(21)
              .toISOString(),
          });

        expect(res.status).toEqual(200);
        expect(res.body.results.length).toBe(1);
        expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
        expect(validateResponse(res)).toBeUndefined();
      });
    });

    // Non-range time filters
    ['dancing', 'busy'].forEach(filter => {
      it(`${filter}Time filter`, async () => {
        await venueRepository.createVenue({
          ...TEST_VENUE_1,
          timeSchedule: {
            [`${filter}From`]: {
              wed: 20 * 3600, // Wednesday 20:00
            },
            open: {
              wed: {
                to: 23 * 3600,
              },
            },
          },
        });
        await venueRepository.createVenue({
          ...TEST_VENUE_3,
          timeSchedule: {
            [`${filter}From`]: {
              thu: 22 * 3600, // Thursday 20:00
            },
          },
          open: {
            wed: {
              to: 23 * 3600,
            },
          },
        });

        const res = await request(global.app)
          .get('/venues')
          .query({
            [`${filter}Time`]: moment()
              .utc()
              .day('wed')
              .hour(21)
              .toISOString(),
          });

        expect(res.status).toEqual(200);
        expect(res.body.results.length).toBe(1);
        expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
        expect(validateResponse(res)).toBeUndefined();
      });
    });

    it('tag filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        tags: [tag1._id.toString()],
      });
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({ tag: tag1._id.toString() });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toBe(venue1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tags filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const tag2 = await tagRepository.createTag(TEST_TAG_2);
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      const venue2 = await venueRepository.createVenue({
        ...TEST_VENUE_2,
        tags: [tag1._id.toString()],
      });
      const venue3 = await venueRepository.createVenue({
        ...TEST_VENUE_3,
        tags: [tag1._id.toString(), tag2._id.toString()],
      });

      const res = await request(global.app)
        .get('/venues')
        .query({ tags: [tag1._id.toString(), tag2._id.toString()] });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results[0].id).toBe(venue3._id.toString());
      expect(res.body.results[1].id).toBe(venue2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it(`bitesTime filter`, async () => {
      await venueRepository.createVenue({
        ...TEST_VENUE_1,
        timeSchedule: {
          open: {
            wed: {
              from: 18 * 3600,
            },
          },
          bitesUntil: {
            wed: 20 * 3600, // Wednesday 20:00
          },
        },
      });
      await venueRepository.createVenue({
        ...TEST_VENUE_2,
        timeSchedule: {
          open: {
            wed: {
              from: 18 * 3600,
            },
          },
          bitesUntil: {
            wed: 18 * 3600,
          },
        },
      });

      const res = await request(global.app)
        .get('/venues')
        .query({
          [`bitesTime`]: moment()
            .utc()
            .day('wed')
            .hour(19)
            .toISOString(),
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    [
      VENUE_FACILITIES.FACILITY_VIP,
      VENUE_FACILITIES.FACILITY_SMOKING_AREA,
      VENUE_FACILITIES.FACILITY_TERRACE,
      VENUE_FACILITIES.FACILITY_TERRACE_HEATERS,
      VENUE_FACILITIES.FACILITY_BOUNCERS,
      VENUE_FACILITIES.FACILITY_KITCHEN,
      VENUE_FACILITIES.FACILITY_COAT_CHECK,
      VENUE_FACILITIES.FACILITY_PARKING,
      VENUE_FACILITIES.FACILITY_CIGARETTES,
      VENUE_FACILITIES.FACILITY_ACCESSIBLE,
    ].forEach(facility => {
      it(`${facility} filter`, async () => {
        await venueRepository.createVenue({
          ...TEST_VENUE_1,
          facilities: [facility],
        });
        await venueRepository.createVenue({
          ...TEST_VENUE_2,
          facilities: [],
        });

        const res = await request(global.app)
          .get('/venues')
          .query({
            [_.camelCase(facility)]: true,
          });

        expect(res.status).toEqual(200);
        expect(res.body.results.length).toBe(1);
        expect(res.body.results[0].name).toBe(TEST_VENUE_1.name);
        expect(validateResponse(res)).toBeUndefined();
      });
    });
  });

  describe('POST /venues', () => {
    const validateResponse = validator.validateResponse('post', '/venues');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/venues')
        .send(venueRepository.deserialize(TEST_VENUE_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.name).toEqual(TEST_VENUE_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /venues/:venueId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/venues/{venueId}'
    );

    it('happy path', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('location fields', async () => {
      const venue1 = await venueRepository.createVenue({
        ...setFixtureLocation(
          {
            ...TEST_VENUE_1,
            location: {
              address1: 'Vechtplantsoen 56',
              address2: '1',
              postalCode: '3554TG',
              city: 'Utrecht',
              country: 'NL',
            },
          },
          COORDINATES_UTRECHT
        ),
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        phoneNumber: '+31623676279',
        description: {
          en: 'Simple description',
        },
        categories: [VENUE_CATEGORIES.CATEGORY_CLUB],
        website: 'http://foo.bar',
        facebook: {
          id: 'facebookid',
          pagesId: 'fbpagesid',
        },
        instagram: {
          id: 'instagramid',
          explorePage: 'explorepage',
        },
        twitterHandle: 'twitterhandle',
        musicTypes: [VENUE_MUSIC_TYPES.MUSIC_APRES_SKI],
        visitorTypes: [VENUE_VISITOR_TYPES.VISITOR_LGBTQ],
        doorPolicy: {
          policy: VENUE_DOORPOLICIES.POLICY_MODERATE,
          description: {
            en: 'Test',
          },
        },
        paymentMethods: [VENUE_PAYMENT_METHODS.METHOD_CASH],
        dresscode: VENUE_DRESSCODES.DRESSCODE_ALTERNATIVE,
        facilities: [VENUE_FACILITIES.FACILITY_ACCESSIBLE],
        timeSchedule: TEST_VENUE_TIMESCHEDULE,
        pageSlug: 'nl/utrecht',
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('tags field', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        tags: [tag1._id.toString()],
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body.tags[0].id).toEqual(tag1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('prices field', async () => {
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        prices: {
          coke: 2,
        },
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('capacity field', async () => {
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        capacity: 250,
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('fees field', async () => {
      const venue1 = await venueRepository.createVenue({
        ...TEST_VENUE_1,
        fees: {
          entrance: 11,
          coatCheck: 2,
        },
      });

      const res = await request(global.app)
        .get(`/venues/${venue1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(VENUE_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /venues/:venueId', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/venues/{venueId}'
    );

    it('happy path', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);

      const res = await request(global.app)
        .put(`/venues/${venue1._id}`)
        .send({
          ...venueRepository.deserialize(TEST_VENUE_1),
          name: 'Other name',
        });

      const updatedVenue = await venueRepository.getVenue(venue1._id);

      expect(res.status).toEqual(200);
      expect(res.body.name).toEqual('Other name');
      expect(updatedVenue.name).toEqual('Other name');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /venues/:venueId/images', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/venues/{venueId}/images'
    );

    it('happy path - multipart', async () => {
      const venue = await venueRepository.createVenue(TEST_VENUE_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');

      const res = await request(global.app)
        .post(`/venues/${venue.id}/images`)
        .attach(VENUE_IMAGE_PERSPECTIVES[0], IMAGE_FIXTURE_PATH);

      expect(res.status).toEqual(200);
      expect(res.body.results[0].url).toEqual('testurl');
      expect(res.body.results[0].filesize).toEqual(1884);
      expect(res.body.results[0].filetype).toEqual('image/jpeg');
      expect(res.body.results[0].width).toEqual(400);
      expect(res.body.results[0].height).toEqual(400);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('happy path - url', async () => {
      const venue = await venueRepository.createVenue(TEST_VENUE_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');
      sandbox.stub(nodeRequest, 'get').resolves({
        body: fs.readFileSync(IMAGE_FIXTURE_PATH),
        headers: {
          'content-type': 'image/jpeg',
        },
      });

      const res = await request(global.app)
        .post(`/venues/${venue.id}/images`)
        .send({
          images: [
            {
              url: 'http://testurl.com',
              perspective: VENUE_IMAGE_PERSPECTIVES[0],
            },
          ],
        });

      expect(res.status).toEqual(200);
      expect(res.body.results[0].url).toEqual('testurl');
      expect(res.body.results[0].filesize).toEqual(1884);
      expect(res.body.results[0].filetype).toEqual('image/jpeg');
      expect(res.body.results[0].width).toEqual(400);
      expect(res.body.results[0].height).toEqual(400);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /venues/:venueId/facebook-events', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/venues/{venueId}/facebook-events'
    );
    let venue1;
    let event1;

    beforeEach(async () => {
      venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      event1 = _.set(
        { ...TEST_FACEBOOK_EVENT_1 },
        'organiser.venue',
        venue1._id.toString()
      );
    });

    it('adds new events', async () => {
      const res = await request(global.app)
        .put(`/venues/${venue1._id}/facebook-events`)
        .send([eventRepository.deserialize(event1)]);

      const venueEvents = await eventRepository.getEvents({
        venueId: venue1._id,
      });

      expect(res.status).toEqual(200);
      expect(venueEvents.length).toEqual(1);
      expect(venueEvents[0].facebook.id).toEqual(
        TEST_FACEBOOK_EVENT_1.facebook.id
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('deletes old future events', async () => {
      const event2Data = eventRepository.deserialize(
        _({ ...TEST_FACEBOOK_EVENT_2 })
          .set('organiser.venue', venue1._id.toString())
          .set('facebook.id', 'bar')
          .value()
      );
      const res = await request(global.app)
        .put(`/venues/${venue1._id}/facebook-events`)
        .send([event2Data]);

      const venueEvents = await eventRepository.getEvents({
        venueId: venue1._id,
      });

      expect(res.status).toEqual(200);
      expect(venueEvents.length).toEqual(1);
      expect(venueEvents[0].facebook.id).toEqual('bar');
      expect(validateResponse(res)).toBeUndefined();
    });

    it('does not delete past events', async () => {
      await eventRepository.createEvent({
        ...event1,
        dates: [
          {
            from: new Date(2018, 1, 1),
            to: new Date(2018, 1, 2),
          },
        ],
      });

      const res = await request(global.app)
        .put(`/venues/${venue1._id}/facebook-events`)
        .send([]);

      const venueEvents = await eventRepository.getEvents({
        venueId: venue1._id,
      });

      expect(res.status).toEqual(200);
      expect(venueEvents.length).toEqual(1);
      expect(venueEvents[0]._id.toString()).toEqual(TEST_FACEBOOK_EVENT_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('updates existing events with a facebook id', async () => {
      const res = await request(global.app)
        .put(`/venues/${venue1._id}/facebook-events`)
        .send([
          {
            ...eventRepository.deserialize(event1),
            facebook: {
              id: event1.facebook.id,
              title: 'newtitle',
            },
          },
        ]);

      const venueEvents = await eventRepository.getEvents({
        venueId: venue1._id,
      });

      expect(res.status).toEqual(200);
      expect(venueEvents.length).toEqual(1);
      expect(venueEvents[0].facebook.id).toEqual(event1.facebook.id);
      expect(venueEvents[0].facebook.title).toEqual('newtitle');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /venues/:venueId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/venues/{venueId}'
    );

    it('happy path', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);

      const res = await request(global.app).delete(`/venues/${venue1._id}`);

      const venue = await venueRepository.getVenue(venue1._id);

      expect(venue).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
