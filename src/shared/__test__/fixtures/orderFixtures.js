const { deepFreeze } = require('../../util/objects');
const { ORDER_STATUSES } = require('../../constants');

const TEST_ORDER_1 = deepFreeze({
  _id: '5d5fec61876feb1e5b905dfd',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  amount: 10,
  currency: 'EUR',
  items: [
    {
      sku: 'abc',
      quantity: 1,
      price: 10,
    },
  ],
});

const TEST_ORDER_2 = deepFreeze({
  _id: '5d8b5256e1eec5977ceeffba',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  amount: 20.5,
  currency: 'USD',
  items: [
    {
      sku: '123',
      quantity: 2,
      price: 20.5,
    },
  ],
});

const TEST_ORDER_3 = deepFreeze({
  _id: '5d95ed62aee3f4f9c18c04e5',
  status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
  amount: 1000,
  currency: 'EUR',
  items: [
    {
      sku: '12345',
      quantity: 1,
      price: 1000,
    },
  ],
});

module.exports = {
  TEST_ORDER_1,
  TEST_ORDER_2,
  TEST_ORDER_3,
};
