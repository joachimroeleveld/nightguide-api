const { deepFreeze } = require('../../util/objects');
const { ORDER_STATUSES } = require('../../constants');

const TEST_ORDER_1 = deepFreeze({
  _id: '5d5fec61876feb1e5b905dfd',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  billingDetails: {
    email: 'foo@bar.nl',
    name: 'Foo Bar',
    address: {
      country: 'NL',
    },
  },
  items: [
    {
      sku: 'abc',
      quantity: 1,
      price: 10,
      currency: 'EUR',
    },
  ],
  paymentMethod: {
    type: 'ideal',
  },
});

const TEST_ORDER_2 = deepFreeze({
  _id: '5d8b5256e1eec5977ceeffba',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  billingDetails: {
    email: 'test@test.nl',
    name: 'Test test',
    address: {
      country: 'BE',
    },
  },
  items: [
    {
      sku: '123',
      quantity: 2,
      price: 20.5,
      currency: 'USD',
    },
  ],
  paymentMethod: {
    type: 'card',
  },
});

const TEST_ORDER_3 = deepFreeze({
  _id: '5d95ed62aee3f4f9c18c04e5',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  billingDetails: {
    email: 'john@doe.com',
    name: 'John Doe',
    address: {
      country: 'DE',
    },
  },
  items: [
    {
      sku: '12345',
      quantity: 1,
      price: 1000,
      currency: 'EUR',
    },
  ],
  paymentMethod: {
    type: 'card',
  },
});

module.exports = {
  TEST_ORDER_1,
  TEST_ORDER_2,
  TEST_ORDER_3,
};
