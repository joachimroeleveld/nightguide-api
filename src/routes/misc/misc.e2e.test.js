require('../../shared/__test__/testBootstrap');

const request = require('supertest');
const sinon = require('sinon');

const { clearDb } = require('../../shared/__test__/testUtils');
const validator = require('../../shared/validator');
const mailService = require('../../shared/services/mail');

const sandbox = sinon.createSandbox();

describe('users e2e', () => {
  afterEach(async () => {
    sandbox.restore();
    await clearDb();
  });

  describe('POST /misc/user-feedback', () => {
    const validateResponse = validator.validateResponse(
      'post',
      '/misc/user-feedback'
    );

    it('happy path', async () => {
      sandbox.stub(mailService, 'sendBasicEmail').resolves();

      const res = await request(global.app)
        .post('/misc/user-feedback')
        .send({
          message: 'test message',
        });

      expect(res.status).toEqual(200);
      expect(mailService.sendBasicEmail.getCall(0).args).toMatchSnapshot();
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
