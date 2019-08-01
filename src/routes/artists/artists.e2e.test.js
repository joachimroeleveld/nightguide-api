require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_ARTIST_1,
  TEST_ARTIST_2,
  TEST_ARTIST_3,
} = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const artistRepository = require('./artistRepository');

const ARTIST_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('artists e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /artists', () => {
    const validateResponse = validator.validateResponse('get', '/artists');

    it('happy path', async () => {
      await artistRepository.createArtist(TEST_ARTIST_1);

      const res = await request(global.app).get('/artists');

      expect(res.status).toEqual(200);
      expect(res.body.totalCount).toEqual(1);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        ARTIST_SNAPSHOT_MATCHER,
        `
Object {
  "__v": 0,
  "createdAt": Any<String>,
  "id": Any<String>,
  "name": "Avicii",
  "updatedAt": Any<String>,
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);
      await artistRepository.createArtist(TEST_ARTIST_2);

      const res = await request(global.app)
        .get('/artists')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(artist1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      await artistRepository.createArtist(TEST_ARTIST_1);
      const artist2 = await artistRepository.createArtist(TEST_ARTIST_2);

      const res = await request(global.app)
        .get('/artists')
        .query({
          offset: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(artist2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns a totalcount with each result', async () => {
      await artistRepository.createArtist(TEST_ARTIST_1);
      await artistRepository.createArtist(TEST_ARTIST_2);

      const res = await request(global.app)
        .get('/artists')
        .query({ limit: 1 });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);
      const artist2 = await artistRepository.createArtist(TEST_ARTIST_2);
      await artistRepository.createArtist(TEST_ARTIST_3);

      const ids = [artist1._id.toString(), artist2._id.toString()].sort();

      const res = await request(global.app)
        .get('/artists')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id).sort()).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('query filter', async () => {
      const artist1 = await artistRepository.createArtist({
        ...TEST_ARTIST_1,
        name: 'Test',
      });
      await artistRepository.createArtist(TEST_ARTIST_2);

      const res = await request(global.app)
        .get('/artists')
        .query({
          query: 'Test',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(artist1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /artists/:artistId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/artists/{artistId}'
    );

    it('happy path', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);

      const res = await request(global.app)
        .get(`/artists/${artist1._id.toString()}`)
        .send()
        .expect(200);

      expect(res.body.id).toEqual(artist1._id.toString());
      expect(res.body).toMatchSnapshot(ARTIST_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const artist1 = await artistRepository.createArtist({
        ...TEST_ARTIST_1,
        name: 'Foo',
      });

      const res = await request(global.app)
        .get(`/artists/${artist1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(ARTIST_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /artists', () => {
    const validateResponse = validator.validateResponse('post', '/artists');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/artists')
        .send(artistRepository.deserialize(TEST_ARTIST_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.id).toEqual(TEST_ARTIST_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('does not allow creating docs with the same name', async () => {
      await artistRepository.createArtist({
        ...TEST_ARTIST_1,
        name: 'Foo',
      });

      const res = await request(global.app)
        .post('/artists')
        .send({
          ...artistRepository.deserialize(TEST_ARTIST_2),
          name: 'Foo',
        });

      expect(res.status).toEqual(500);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /artists', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/artists/{artistId}'
    );

    it('happy path', async () => {
      const artist1 = await artistRepository.createArtist(TEST_ARTIST_1);

      const res = await request(global.app)
        .put(`/artists/${artist1._id}`)
        .send({
          name: 'Bar',
        });
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.id).toEqual(TEST_ARTIST_1._id);
      expect(body.name).toEqual('Bar');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /artists/:artistId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/artists/{artistId}'
    );

    it('happy path', async () => {
      const createdArtist = await artistRepository.createArtist(TEST_ARTIST_1);

      const res = await request(global.app).delete(
        `/artists/${createdArtist._id}`
      );

      let artist = await artistRepository.getArtist(createdArtist._id);

      expect(artist).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
