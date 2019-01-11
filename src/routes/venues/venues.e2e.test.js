require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');
const _ = require('lodash');

const validator = require('../../shared/validator');
const imagesService = require('../../shared/services/images');
const { TEST_VENUE_1 } = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const venueRepository = require('./venueRepository');

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
      expect(res.body.results[0]).toMatchObject(TEST_VENUE_1);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const venue1 = await venueRepository.createVenue(TEST_VENUE_1);
      await venueRepository.createVenue(TEST_VENUE_1);

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
  });

  describe('POST /venues', () => {
    const validateResponse = validator.validateResponse('post', '/venues');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/venues')
        .send(TEST_VENUE_1);
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.name).toEqual(TEST_VENUE_1.name);
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
          ...TEST_VENUE_1,
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

    it('happy path', async () => {
      const venue = await venueRepository.createVenue(TEST_VENUE_1);

      sandbox.stub(imagesService, 'upload').resolves();
      sandbox.stub(imagesService, 'getServeableUrl').resolves('testurl');

      const res = await request(global.app)
        .post(`/venues/${venue.id}/images`)
        .attach('image', 'src/shared/__test__/fixtures/images/square.jpg');
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.url).toEqual('testurl');
      expect(body.filesize).toEqual(1884);
      expect(body.filetype).toEqual('image/jpeg');
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
