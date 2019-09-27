require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_CONTENT_1,
  TEST_CONTENT_2,
  generateMongoFixture,
} = require('../../shared/__test__/fixtures');
const { CONTENT_TYPES } = require('../../shared/constants');
const { resetDb } = require('../../shared/__test__/testUtils');
const contentRepository = require('./contentRepository');

const CONTENT_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('content e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /content', () => {
    const validateResponse = validator.validateResponse('get', '/content');

    it('happy path', async () => {
      await contentRepository.createContent(TEST_CONTENT_1);

      const res = await request(global.app).get(`/content`);

      expect(res.status).toEqual(200);
      expect(res.body.totalCount).toEqual(1);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        CONTENT_SNAPSHOT_MATCHER,
        `
Object {
  "__v": 0,
  "createdAt": Any<String>,
  "id": Any<String>,
  "pageSlug": "nl/utrecht",
  "title": Object {
    "en": "Pretty interesting article",
  },
  "type": "venues-article",
  "updatedAt": Any<String>,
  "urlSlugs": Array [
    "pretty-interesting-article",
  ],
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const content1 = await contentRepository.createContent(TEST_CONTENT_1);
      await contentRepository.createContent(TEST_CONTENT_2);

      const res = await request(global.app)
        .get(`/content`)
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(content1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      await contentRepository.createContent(TEST_CONTENT_1);
      const content2 = await contentRepository.createContent(TEST_CONTENT_2);

      const res = await request(global.app)
        .get(`/content`)
        .query({
          offset: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(content2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns a totalcount with each result', async () => {
      await contentRepository.createContent(TEST_CONTENT_1);
      await contentRepository.createContent(TEST_CONTENT_2);

      const res = await request(global.app)
        .get(`/content`)
        .query({ limit: 1 });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('type filter', async () => {
      await contentRepository.createContent({
        ...TEST_CONTENT_1,
        type: CONTENT_TYPES.CONTENT_TYPE_PAGE,
      });
      await contentRepository.createContent({
        ...TEST_CONTENT_2,
        type: CONTENT_TYPES.CONTENT_TYPE_VENUES_ARTICLE,
      });

      const res = await request(global.app)
        .get(`/content`)
        .query({
          type: CONTENT_TYPES.CONTENT_TYPE_PAGE,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_CONTENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const content1 = await contentRepository.createContent(TEST_CONTENT_1);
      const content2 = await contentRepository.createContent(TEST_CONTENT_2);
      await contentRepository.createContent(
        generateMongoFixture(TEST_CONTENT_1)
      );

      const ids = [content1._id.toString(), content2._id.toString()].sort();

      const res = await request(global.app)
        .get(`/content`)
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id).sort()).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('pageSlug filter', async () => {
      await contentRepository.createContent({
        ...TEST_CONTENT_1,
        pageSlug: 'nl/utrecht',
      });
      await contentRepository.createContent({
        ...TEST_CONTENT_2,
        pageSlug: 'es/ibiza',
      });

      const res = await request(global.app)
        .get(`/content`)
        .query({
          pageSlug: 'nl/utrecht',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].name).toBe(TEST_CONTENT_1.name);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /content/:contentId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/content/{contentId}'
    );

    it('happy path', async () => {
      await contentRepository.createContent(TEST_CONTENT_1);

      const res = await request(global.app)
        .get(`/content/${TEST_CONTENT_1._id}`)
        .send()
        .expect(200);

      expect(res.body.id).toEqual(TEST_CONTENT_1._id);
      expect(res.body).toMatchSnapshot(CONTENT_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /content/slug/:slug', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/content/slug/{slug}'
    );

    it('happy path', async () => {
      const content1 = await contentRepository.createContent({
        ...TEST_CONTENT_1,
        urlSlugs: ['test'],
      });

      const res = await request(global.app)
        .get(`/content/slug/${content1.urlSlug}`)
        .send()
        .expect(200);

      expect(res.body.urlSlugs[0]).toEqual(content1.urlSlug);
      expect(res.body.id).toEqual(content1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /content', () => {
    const validateResponse = validator.validateResponse('post', '/content');

    it('happy path', async () => {
      const res = await request(global.app)
        .post(`/content`)
        .send(contentRepository.deserialize(TEST_CONTENT_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.id).toEqual(TEST_CONTENT_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('generates a URL slug from the title if not provided', async () => {
      const res = await request(global.app)
        .post(`/content`)
        .send({
          ...contentRepository.deserialize(TEST_CONTENT_1),
          title: { en: ' This is a test ' },
        });

      expect(res.status).toEqual(201);
      expect(res.body.urlSlugs[0]).toEqual('this-is-a-test');
      expect(validateResponse(res)).toBeUndefined();
    });

    it("doesn't overwrite the URL slug if provided", async () => {
      const res = await request(global.app)
        .post(`/content`)
        .send({
          ...contentRepository.deserialize(TEST_CONTENT_1),
          urlSlugs: ['test'],
        });

      expect(res.status).toEqual(201);
      expect(res.body.urlSlugs[0]).toEqual('test');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /content', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/content/{contentId}'
    );

    it('happy path', async () => {
      const content1 = await contentRepository.createContent(TEST_CONTENT_1);

      const res = await request(global.app)
        .put(`/content/${content1._id}`)
        .send({
          ...contentRepository.deserialize(TEST_CONTENT_1),
          title: {
            en: 'changed',
          },
        });
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.id).toEqual(TEST_CONTENT_1._id);
      expect(body.title.en).toEqual('changed');
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ensures a unique URL slug', async () => {
      await contentRepository.createContent({
        ...TEST_CONTENT_1,
        urlSlugs: ['test'],
      });
      const content2 = await contentRepository.createContent(TEST_CONTENT_2);

      const res = await request(global.app)
        .put(`/content/${content2._id.toString()}`)
        .send({
          ...contentRepository.deserialize(TEST_CONTENT_2),
          urlSlugs: ['test'],
        });

      const body = res.body;
      expect(res.status).toEqual(200);
      expect(body.id).toEqual(content2._id.toString());
      expect(body.urlSlugs[0]).toEqual('test-2');
      expect(validateResponse(res)).toBeUndefined();
    });

    it('preserves the old slug when if changed', async () => {
      const content1 = await contentRepository.createContent({
        ...TEST_CONTENT_1,
        urlSlugs: ['foo'],
      });

      const res = await request(global.app)
        .put(`/content/${content1._id.toString()}`)
        .send({
          ...contentRepository.deserialize(TEST_CONTENT_1),
          urlSlugs: ['bar'],
        });

      const body = res.body;
      expect(res.status).toEqual(200);
      expect(body.id).toEqual(content1._id.toString());
      expect(body.urlSlugs[0]).toEqual('bar');
      expect(body.urlSlugs[1]).toEqual('foo');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /content/:contentId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/content/{contentId}'
    );

    it('happy path', async () => {
      const createdTag = await contentRepository.createContent(TEST_CONTENT_1);

      const res = await request(global.app).delete(
        `/content/${createdTag._id.toString()}`
      );

      let content = await contentRepository.getContentSingle(
        createdTag._id.toString()
      );

      expect(content).toBe(null);
      expect(res.status).toEqual(200);
      expect(res.body.success).toEqual(true);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
