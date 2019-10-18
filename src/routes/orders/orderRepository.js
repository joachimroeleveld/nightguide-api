const Order = require('./orderModel');
const _ = require('lodash');
const { NotFoundError } = require('../../shared/errors');
const { serialize, deserialize } = require('./lib/serialization');
const { match } = require('./lib/aggregation');

async function getOrders(opts = {}, withCount = false) {
  const { offset, limit, ...filters } = opts;

  const createAgg = () => {
    const agg = Order.aggregate();
    return match(agg, filters);
  };

  let countAgg;
  if (withCount) {
    countAgg = createAgg();
    countAgg.group({
      _id: null,
      totalCount: { $sum: 1 },
    });
  }

  const agg = createAgg();

  agg.sort({ name: 1 });

  if (offset) {
    agg.append({
      $skip: offset,
    });
  }
  if (limit) {
    agg.limit(limit);
  }

  const results = await agg.exec();

  if (withCount) {
    const countResult = await countAgg.exec();
    const count = (countResult.length && countResult[0].totalCount) || 0;
    return { totalCount: count, results };
  } else {
    return results;
  }
}

async function getOrder(orderId, opts = {}) {
  return await Order.findById(orderId).exec();
}

async function createOrder(data) {
  return Order.create(data);
}

async function updateOrder(conditions, data, options = {}) {
  let where = conditions;
  if (_.isString(conditions)) {
    where = { _id: conditions };
  }
  const order = await Order.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (!order) {
    throw new NotFoundError('order_not_found');
  }

  return order;
}

async function deleteOrder(id, opts) {
  return Order.findByIdAndRemove(id, opts).exec();
}

module.exports = {
  getOrders,
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  serialize,
  deserialize,
};
