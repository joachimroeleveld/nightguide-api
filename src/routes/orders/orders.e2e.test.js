require('../../shared/__test__/testBootstrap');

const update = require('immutability-helper');
const request = require('supertest');
const sinon = require('sinon');

const { validator } = require('../../shared/openapi');
const {
  TEST_ORDER_1,
  TEST_ORDER_2,
  TEST_ORDER_3,
} = require('../../shared/__test__/fixtures');
const { resetDb } = require('../../shared/__test__/testUtils');
const orderRepository = require('./orderRepository');
const { ORDER_STATUSES } = require('../../shared/constants');

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
  "billingDetails": Object {
    "address": Object {
      "country": "NL",
    },
    "email": "foo@bar.nl",
    "name": "Foo Bar",
  },
  "createdAt": Any<String>,
  "id": Any<String>,
  "items": Any<Array>,
  "paymentMethod": Object {
    "type": "ideal",
  },
  "status": "completed",
  "updatedAt": Any<String>,
}
`
      );
      expect(res.body.results[0].items[0]).toMatchInlineSnapshot(
        ORDER_ITEM_SNAPSHOT_MATCHER,
        `
Object {
  "currency": "EUR",
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
      await orderRepository.createOrder(TEST_ORDER_2);

      const res = await request(global.app)
        .get('/orders')
        .query({
          limit: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.limit).toEqual(1);
      expect(res.body.results[0].id).toEqual(order1._id.toString());
      expect(validateResponse(res)).toBeUndefined();
    });

    it('should skip items set in offset parameter', async () => {
      await orderRepository.createOrder(TEST_ORDER_1);
      const order2 = await orderRepository.createOrder(TEST_ORDER_2);

      const res = await request(global.app)
        .get('/orders')
        .query({
          offset: 1,
        });

      expect(res.status).toEqual(200);
      expect(res.body.results.length).toEqual(1);
      expect(res.body.offset).toEqual(1);
      expect(res.body.results[0].id).toEqual(order2._id.toString());
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
            address: {
              city: { $set: 'Magalhaesstraat 6' },
              line1: { $set: 'Vechtplantsoen 56' },
              line2: { $set: '1' },
              postalCode: { $set: '3554 TG' },
              state: { $set: 'California' },
            },
          },
          items: {
            [0]: {
              eventId: { $set: '5d95ed62aee3f4f9c18c04e5' },
            },
          },
          paymentMethod: {
            ideal: {
              $set: {
                bank: 'ing',
              },
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
});
