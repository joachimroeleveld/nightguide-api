require('../shared/__test__/testBootstrap');

const request = require('supertest');
const { NOT_FOUND, OK } = require('http-status');

describe('expressServer', () => {
  describe('health', () => {
    it('returns with 200', async () => {
      await request(global.app)
        .get('/health')
        .expect(OK);
    });
  });

  describe('unknown endpoints', () => {
    it('returns 404 for unknown endpoints', async () => {
      await request(global.app)
        .get('/fake')
        .expect(NOT_FOUND);
    });
  });
});
