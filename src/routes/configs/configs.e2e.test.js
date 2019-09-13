require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_CONFIG_1,
  TEST_CONFIG_2,
  TEST_CONFIG_3,
} = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const configRepository = require('./configRepository');

const CONFIG_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('configs e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /configs', () => {
    const validateResponse = validator.validateResponse('get', '/configs');

    it('happy path', async () => {
      await configRepository.createConfig(TEST_CONFIG_1);

      const res = await request(global.app).get('/configs');

      expect(res.status).toEqual(200);
      expect(res.body.totalCount).toEqual(1);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        CONFIG_SNAPSHOT_MATCHER,
        `
Object {
  "__v": 0,
  "createdAt": Any<String>,
  "id": Any<String>,
  "name": "Config A",
  "payload": Object {
    "setting": 1,
  },
  "updatedAt": Any<String>,
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const config1 = await configRepository.createConfig(TEST_CONFIG_1);
      await configRepository.createConfig(TEST_CONFIG_2);

      const res = await request(global.app)
        .get('/configs')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(config1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      await configRepository.createConfig(TEST_CONFIG_1);
      const config2 = await configRepository.createConfig(TEST_CONFIG_2);

      const res = await request(global.app)
        .get('/configs')
        .query({
          offset: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(config2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns a totalcount with each result', async () => {
      await configRepository.createConfig(TEST_CONFIG_1);
      await configRepository.createConfig(TEST_CONFIG_2);

      const res = await request(global.app)
        .get('/configs')
        .query({ limit: 1 });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const config1 = await configRepository.createConfig(TEST_CONFIG_1);
      const config2 = await configRepository.createConfig(TEST_CONFIG_2);
      await configRepository.createConfig(TEST_CONFIG_3);

      const ids = [config1._id.toString(), config2._id.toString()].sort();

      const res = await request(global.app)
        .get('/configs')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id).sort()).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('query filter', async () => {
      const config1 = await configRepository.createConfig({
        ...TEST_CONFIG_1,
        name: 'Test',
      });
      await configRepository.createConfig(TEST_CONFIG_2);

      const res = await request(global.app)
        .get('/configs')
        .query({
          query: 'Test',
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(config1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /configs/:configId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/configs/{configId}'
    );

    it('happy path', async () => {
      const config1 = await configRepository.createConfig(TEST_CONFIG_1);

      const res = await request(global.app)
        .get(`/configs/${config1._id.toString()}`)
        .send()
        .expect(200);

      expect(res.body.id).toEqual(config1._id.toString());
      expect(res.body).toMatchSnapshot(CONFIG_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const config1 = await configRepository.createConfig({
        ...TEST_CONFIG_1,
        name: 'Foo',
      });

      const res = await request(global.app)
        .get(`/configs/${config1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(CONFIG_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /configs', () => {
    const validateResponse = validator.validateResponse('post', '/configs');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/configs')
        .send(configRepository.deserialize(TEST_CONFIG_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.id).toEqual(TEST_CONFIG_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('does not allow creating docs with the same name', async () => {
      await configRepository.createConfig({
        ...TEST_CONFIG_1,
        name: 'Foo',
      });

      const res = await request(global.app)
        .post('/configs')
        .send({
          ...configRepository.deserialize(TEST_CONFIG_2),
          name: 'Foo',
        });

      expect(res.status).toEqual(500);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /configs', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/configs/{configId}'
    );

    it('happy path', async () => {
      const config1 = await configRepository.createConfig(TEST_CONFIG_1);

      const res = await request(global.app)
        .put(`/configs/${config1._id}`)
        .send({
          name: 'Bar',
        });
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.id).toEqual(TEST_CONFIG_1._id);
      expect(body.name).toEqual('Bar');
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /configs/:configId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/configs/{configId}'
    );

    it('happy path', async () => {
      const createdConfig = await configRepository.createConfig(TEST_CONFIG_1);

      const res = await request(global.app).delete(
        `/configs/${createdConfig._id}`
      );

      let config = await configRepository.getConfig(createdConfig._id);

      expect(config).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
