require('../../shared/__test__/testBootstrap');

const fs = require('fs');
const update = require('immutability-helper');
const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_ORDER_1,
  TEST_ORDER_2,
  TEST_ORDER_3,
  TEST_EVENT_1,
  PDF_FIXTURE_PATH,
} = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const orderRepository = require('./orderRepository');
const eventRepository = require('../events/eventRepository');
const { ORDER_STATUSES } = require('../../shared/constants');
const mail = require('../../shared/services/mail');
const downloads = require('./lib/downloads');
const ticketsTemplate = require('../../shared/templates/pdf/tickets');

const ORDER_SNAPSHOT_MATCHER = {
  id: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  items: expect.any(Array),
};

const ORDER_ITEM_SNAPSHOT_MATCHER = {
  id: expect.any(String),
};

const sandbox = sinon.createSandbox();

describe('orders e2e', () => {
  beforeEach(async () => {
    sandbox.restore();
    await resetDb();
  });

  describe('GET /orders', () => {
    const validateResponse = validator.validateResponse('get', '/orders');

    it('happy path', async () => {
      await orderRepository.createOrder(TEST_ORDER_1);

      const res = await request(global.app).get('/orders');

      expect(res.status).toEqual(200);
      expect(res.body.totalCount).toEqual(1);
      expect(res.body.results[0]).toMatchInlineSnapshot(
        ORDER_SNAPSHOT_MATCHER,
        `
Object {
  "__v": 0,
  "amount": 10,
  "createdAt": Any<String>,
  "currency": "EUR",
  "id": Any<String>,
  "items": Any<Array>,
  "status": "completed",
  "updatedAt": Any<String>,
}
`
      );
      expect(res.body.results[0].items[0]).toMatchInlineSnapshot(
        ORDER_ITEM_SNAPSHOT_MATCHER,
        `
Object {
  "id": Any<String>,
  "price": 10,
  "quantity": 1,
  "sku": "abc",
}
`
      );
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should limit the amount of results to the limit parameter', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);
      const order2 = await orderRepository.createOrder(TEST_ORDER_2);

      const res = await request(global.app)
        .get('/orders')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(order2._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);
      const order2 = await orderRepository.createOrder(TEST_ORDER_2);

      const res = await request(global.app)
        .get('/orders')
        .query({
          offset: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(order1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('returns a totalcount with each result', async () => {
      await orderRepository.createOrder(TEST_ORDER_1);
      await orderRepository.createOrder(TEST_ORDER_2);

      const res = await request(global.app)
        .get('/orders')
        .query({ limit: 1 });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('ids filter', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);
      const order2 = await orderRepository.createOrder(TEST_ORDER_2);
      await orderRepository.createOrder(TEST_ORDER_3);

      const ids = [order1._id.toString(), order2._id.toString()].sort();

      const res = await request(global.app)
        .get('/orders')
        .query({
          ids,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results.map(item => item.id).sort()).toEqual(ids);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('status filter', async () => {
      const order1 = await orderRepository.createOrder(
        update(TEST_ORDER_1, {
          status: { $set: ORDER_STATUSES.ORDER_STATUS_PROCESSING },
        })
      );
      await orderRepository.createOrder(
        update(TEST_ORDER_2, {
          status: { $set: ORDER_STATUSES.ORDER_STATUS_PENDING },
        })
      );

      const res = await request(global.app)
        .get('/orders')
        .query({
          status: ORDER_STATUSES.ORDER_STATUS_PROCESSING,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].id).toEqual(order1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('GET /orders/:orderId', () => {
    const validateResponse = validator.validateResponse(
      'get',
      '/orders/{orderId}'
    );

    it('happy path', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);

      const res = await request(global.app)
        .get(`/orders/${order1._id.toString()}`)
        .send()
        .expect(200);

      expect(res.body.id).toEqual(order1._id.toString());
      expect(res.body).toMatchSnapshot(ORDER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('simple fields', async () => {
      const order1 = await orderRepository.createOrder(
        update(TEST_ORDER_1, {
          billingDetails: {
            $set: {
              name: 'Joachim Roeleveld',
              email: 'foo@bar.nl',
              address: {
                country: 'NL',
                city: 'Magalhaesstraat 6',
                line1: 'Vechtplantsoen 56',
                line2: '1',
                postalCode: '3554 TG',
                state: 'California',
              },
            },
          },
          metadata: {
            $set: {
              eventId: '5d95ed62aee3f4f9c18c04e5',
            },
          },
        })
      );

      const res = await request(global.app)
        .get(`/orders/${order1._id}`)
        .send()
        .expect(200);

      expect(res.body).toMatchSnapshot(ORDER_SNAPSHOT_MATCHER);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('POST /orders', () => {
    const validateResponse = validator.validateResponse('post', '/orders');

    it('happy path', async () => {
      const res = await request(global.app)
        .post('/orders')
        .send(orderRepository.deserialize(TEST_ORDER_1));
      const body = res.body;

      expect(res.status).toEqual(201);
      expect(body.id).toEqual(TEST_ORDER_1._id);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /orders', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/orders/{orderId}'
    );

    it('happy path', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);

      const res = await request(global.app)
        .put(`/orders/${order1._id}`)
        .send({
          status: ORDER_STATUSES.ORDER_STATUS_PENDING,
        });
      const body = res.body;

      expect(res.status).toEqual(200);
      expect(body.id).toEqual(TEST_ORDER_1._id);
      expect(body.status).toEqual(ORDER_STATUSES.ORDER_STATUS_PENDING);
      expect(validateResponse(res)).toBeUndefined();
    });

    it('creates a downloads key when status changes to processing', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);
      const order1 = await orderRepository.createOrder({
        ...TEST_ORDER_1,
        status: ORDER_STATUSES.ORDER_STATUS_PENDING,
        metadata: { eventId: event._id },
      });

      sandbox.stub(downloads, 'generateDownloadsKey').returns('abc');

      const res = await request(global.app)
        .put(`/orders/${order1._id}`)
        .send({
          status: ORDER_STATUSES.ORDER_STATUS_PROCESSING,
        });

      expect(res.status).toEqual(200);
      expect(res.body.downloads.key).toEqual('abc');
      expect(validateResponse(res)).toBeUndefined();
    });

    it('sends a ticket mail when status changes to processing', async () => {
      const event = await eventRepository.createEvent(TEST_EVENT_1);
      const order1 = await orderRepository.createOrder({
        ...TEST_ORDER_1,
        status: ORDER_STATUSES.ORDER_STATUS_PENDING,
        metadata: { eventId: event._id },
      });

      sandbox.stub(downloads, 'generateDownloadsKey').returns('abc');
      sandbox
        .stub(ticketsTemplate, 'render')
        .resolves(fs.createReadStream(PDF_FIXTURE_PATH));
      sandbox.stub(mail, 'sendBasicEmail').resolves();

      const res = await request(global.app)
        .put(`/orders/${order1._id}`)
        .send({
          status: ORDER_STATUSES.ORDER_STATUS_PROCESSING,
        });

      expect(res.status).toEqual(200);
      expect(mail.sendBasicEmail.getCall(0).args[0]).toBe(
        order1.billingDetails.email
      );
      expect(mail.sendBasicEmail.getCall(0).args[1]).toMatchSnapshot();
      expect(mail.sendBasicEmail.getCall(0).args[2]).toMatchSnapshot();
      expect(mail.sendBasicEmail.getCall(0).args[3]).toMatchSnapshot();
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('DELETE /orders/:orderId', () => {
    const validateResponse = validator.validateResponse(
      'delete',
      '/orders/{orderId}'
    );

    it('happy path', async () => {
      const createdConfig = await orderRepository.createOrder(TEST_ORDER_1);

      const res = await request(global.app).delete(
        `/orders/${createdConfig._id}`
      );

      let order = await orderRepository.getOrder(createdConfig._id);

      expect(order).toBe(null);
      expect(res.status).toEqual(200);
      expect(validateResponse(res)).toBeUndefined();
    });
  });

  describe('PUT /orders/:orderId/metadata/:metaKey', () => {
    const validateResponse = validator.validateResponse(
      'put',
      '/orders/{orderId}/metadata/{metaKey}'
    );

    it('happy path', async () => {
      const order1 = await orderRepository.createOrder(TEST_ORDER_1);

      const res = await request(global.app)
        .put(`/orders/${order1._id}/metadata/foo`)
        .send({
          value: 'bar',
        });
      const body = res.body;

      let order = await orderRepository.getOrder(order1._id);

      expect(res.status).toEqual(200);
      expect(body.foo).toEqual('bar');
      expect(order.metadata.foo).toEqual('bar');
      expect(validateResponse(res)).toBeUndefined();
    });
  });
});
