require('../../shared/__test__/testBootstrap');

const fs = require('fs');
const nodeRequest = require('request-promise-native');
const request = require('supertest');
const sinon = require('sinon');
const _ = require('lodash');

const Venue = require('./venueModel');
const { validator } = require('../../shared/openapi');
const imagesService = require('../../shared/services/images');
const {
  TEST_VENUE_1,
  TEST_VENUE_2,
  COORDINATES_THE_HAGUE,
  COORDINATES_WOERDEN,
  COORDINATES_UTRECHT,
} = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const venueRepository = require('./venueRepository');

const VENUE_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('venues e2e', () => {
  afterEach(async () => {
    sandbox.restore();
    await clearDb();
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
  "categories": Array [
    "bar",
  ],
  "description": Object {
    "en": "Tivoli Vredenburg.",
  },
  "facebook": Object {
    "id": "TivoliVredenburgUtrecht",
  },
  "id": "5c001cac8e84e1067f34695c",
  "location": Object {
    "address1": "Vechtplantsoen 56",
    "address2": "1",
    "city": "Utrecht",
    "coordinates": Object {
      "latitude": 52.118273,
      "longitude": 5.085487,
    },
    "country": "NL",
    "postalCode": "3554TG",
  },
  "name": "Tivoli",
  "website": "https://www.tivolivredenburg.nl",
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
        name: 'tobefiltered',
      });
      await venueRepository.createVenue(TEST_VENUE_2);

      const res = await request(global.app)
        .get('/venues')
        .query({
          query: 'tobefiltered',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe('tobefiltered');
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
  });

  describe('POST /venues', () => {
    const validateResponse = validator.validateResponse('post', '/venues');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/venues')
        .send(Venue.deserialize(TEST_VENUE_1));
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
        .send(TEST_VENUE_1)
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
          ...Venue.deserialize(TEST_VENUE_1),
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
    const imagePath = 'src/shared/__test__/fixtures/images/square.jpg';

    it('happy path - multipart', async () => {
      const venue = await venueRepository.createVenue(TEST_VENUE_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');

      const res = await request(global.app)
        .post(`/venues/${venue.id}/images`)
        .attach('images', imagePath);

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
        body: fs.readFileSync(imagePath),
        headers: {
          'content-type': 'image/jpeg',
        },
      });

      const res = await request(global.app)
        .post(`/venues/${venue.id}/images`)
        .send({
          urls: ['http://testurl.com'],
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
});

function setFixtureLocation(fixture, coordinates) {
  return {
    ...fixture,
    location: {
      ...fixture.location,
      coordinates: {
        type: 'Point',
        coordinates: coordinates,
      },
    },
  };
}
