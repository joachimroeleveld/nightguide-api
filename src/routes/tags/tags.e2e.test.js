require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const { TEST_TAG_1 } = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const tagRepository = require('./tagRepository');
const { NotFoundError } = require('../../shared/errors');

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
  "imageUrl": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwj5tOCsm8PiAhUM3aQKHYg2B0YQjRx6BAgBEAU&url=https%3A%2F%2Fwww.tripadvisor.com%2FLocationPhotoDirectLink-g1532344-d15100306-i350431515-Foo-Navi_Mumbai_Maharashtra.html&psig=AOvVaw0v7Vf0EZOfAfanl5sdznYb&ust=1559304306675228",
  "updatedAt": Any<String>,
}
`
      );
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

  // describe('PUT /tags', () => {
  //   const validateResponse = validator.validateResponse('put', '/tags/{tagId}');
  //
  //   it('happy path', async () => {
  //     const tag1 = await tagRepository.createTag(TEST_TAG_1);
  //
  //     const res = await request(global.app)
  //       .put(`/tags/${tag1._id}`)
  //       .send({
  //         ...tagRepository.deserialize(TEST_TAG_1),
  //       });
  //     const body = res.body;
  //
  //     expect(res.status).toEqual(201);
  //     expect(body.id).toEqual(TEST_TAG_1._id);
  //     expect(validateResponse(res)).toBeUndefined();
  //   });
  // });

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
