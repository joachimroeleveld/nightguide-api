require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const validator = require('../../shared/validator');
const imagesService = require('../../shared/services/images');
const { TEST_VENUE_1 } = require('../../shared/__test__/fixtures');
const { clearDb } = require('../../shared/__test__/testUtils');
const { createVenue } = require('./venueRepository');

const sandbox = sinon.createSandbox();

describe('venues e2e', () => {
  afterEach(async () => {
    sandbox.restore();
    await clearDb();
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

  describe('POST /venues/:venueId/images', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/venues/{venueId}/images'
    );

    it('happy path', async () => {
      const venue = await createVenue(TEST_VENUE_1);

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
