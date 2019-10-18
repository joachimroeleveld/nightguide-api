const _ = require('lodash');

/**
 * Prepare order object to be sent to client.
 * @returns {Event}
 */
function deserialize(order) {
  if (order.toObject) {
    order = order.toObject();
  } else {
    order = _.cloneDeep(order);
  }

  if (order.items) {
    order.items = order.items.map(({ _id, ...item }) => ({
      id: _id,
      ...item,
    }));
  }

  order.id = order._id;
  delete order._id;

  return order;
}

/**
 * Prepare order object for database insertion.
 * @param order
 */
function serialize(order) {
  if (order.id) {
    order._id = order.id;
    delete order.id;
  }

  if (order.items) {
    order.items = order.items.map(({ id, ...item }) => ({
      _id: id,
      ...item,
    }));
  }

  return order;
}

module.exports = {
  deserialize,
  serialize,
};
