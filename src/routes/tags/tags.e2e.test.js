require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_TAG_1,
  TEST_TAG_2,
  TEST_TAG_3,
} = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const tagRepository = require('./tagRepository');

const TAG_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('tags e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /tags', () => {
    const validateResponse = validator.validateResponse('get', '/tags');

    it('happy path', async () => {
      await tagRepository.createTag(TEST_TAG_1);

      const res = await request(global.app).get('/tags');

      expect(res.status).toEqual(200);
      expect(res.body.totalCount).toEqual(1);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        TAG_SNAPSHOT_MATCHER,
        `
Object {
  "__v": 0,
  "createdAt": Any<String>,
  "id": Any<String>,
  "name": Object {
    "en": "LGBGTQ",
  },
  "slug": "lgbtq",
  "updatedAt": Any<String>,
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const tag2 = await tagRepository.createTag(TEST_TAG_2);
      await tagRepository.createTag(TEST_TAG_3);

      const ids = [tag1._id.toString(), tag2._id.toString()];

      const res = await request(global.app)
        .get('/tags')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id)).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('slugs filter', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);
      const tag2 = await tagRepository.createTag(TEST_TAG_2);
      await tagRepository.createTag(TEST_TAG_3);

      const slugs = [tag1.slug, tag2.slug];

      const res = await request(global.app)
        .get('/tags')
        .query({
          slugs,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.slug)).toEqual(slugs);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /tags/:tagId', () => {
    const validateResponse = validator.validateResponse('get', '/tags/{tagId}');

    it('happy path', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);

      const res = await request(global.app)
        .get(`/tags/${tag1._id}`)
        .send()
        .expect(200);

      expect(res.body.id).toEqual(tag1._id.toString());
      expect(res.body).toMatchSnapshot(TAG_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const tag1 = await tagRepository.createTag({
        ...TEST_TAG_1,
        slug: 'techno',
        name: {
          en: 'Techno',
        },
      });

      const res = await request(global.app)
        .get(`/tags/${tag1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(TAG_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /tags/slug/:tagSlug', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/tags/slug/{tagSlug}'
    );

    it('happy path', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);

      const res = await request(global.app)
        .get(`/tags/slug/${tag1.slug}`)
        .send()
        .expect(200);

      expect(res.body.slug).toEqual(tag1.slug);
      expect(res.body).toMatchSnapshot(TAG_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /tags', () => {
    const validateResponse = validator.validateResponse('post', '/tags');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/tags')
        .send(tagRepository.deserialize(TEST_TAG_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.id).toEqual(TEST_TAG_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /tags', () => {
    const validateResponse = validator.validateResponse('put', '/tags/{tagId}');

    it('happy path', async () => {
      const tag1 = await tagRepository.createTag(TEST_TAG_1);

      const res = await request(global.app)
        .put(`/tags/${tag1._id}`)
        .send({
          name: {
            en: 'changed',
          },
        });
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.id).toEqual(TEST_TAG_1._id);
      expect(body.name.en).toEqual('changed');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /tags/:tagId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/tags/{tagId}'
    );

    it('happy path', async () => {
      const createdTag = await tagRepository.createTag(TEST_TAG_1);

      const res = await request(global.app).delete(`/tags/${createdTag._id}`);

      let tag = await tagRepository.getTag(createdTag._id);

      expect(tag).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
