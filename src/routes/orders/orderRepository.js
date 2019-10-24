const Order = require('./orderModel');

const config = require('../../shared/config');
const { serialize, deserialize } = require('./lib/serialization');
const { getEvent } = require('../events/eventRepository');
const { NotFoundError } = require('../../shared/errors');
const { match } = require('./lib/aggregation');
const { ORDER_STATUSES } = require('../../shared/constants');
const { streamToBuffer } = require('../../shared/util/streams');
const downloads = require('./lib/downloads');
const mail = require('../../shared/services/mail');
const { __ } = require('../../framework/i18n');
const { isValidObjectId } = require('../../shared/util/mongooseUtils');

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

  agg.sort({ createdAt: -1 });

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
  if (isValidObjectId(conditions)) {
    where = { _id: conditions };
  }

  const existingOrder = await Order.findOne(where).exec();
  if (!existingOrder) {
    throw new NotFoundError('order_not_found');
  }

  const order = await Order.findOneAndUpdate(where, data, {
    new: true,
    runValidators: true,
    ...options,
  }).exec();

  if (
    existingOrder.status !== ORDER_STATUSES.ORDER_STATUS_PROCESSING &&
    order.status === ORDER_STATUSES.ORDER_STATUS_PROCESSING
  ) {
    return await processOrder(existingOrder._id);
  }

  return order;
}

async function deleteOrder(id, opts) {
  return Order.findByIdAndRemove(id, opts).exec();
}

async function updateOrderMeta(orderId, key, value) {
  const existingOrder = await getOrder(orderId);

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      metadata: {
        ...(existingOrder.metadata || {}),
        [key]: value,
      },
    },
    {
      new: true,
    }
  ).exec();

  return order.metadata;
}

/**
 * Get downloads for order.
 * @param orderId
 * @returns {Promise<*>}
 */
async function getOrderDownloads(orderId) {
  const order = await getOrder(orderId);

  if (!order) {
    throw new NotFoundError('order_not_found');
  }

  const event = await getEvent(order.metadata.eventId, {
    populate: ['organiser.venue'],
  });

  if (!event) {
    throw new NotFoundError('event_not_found');
  }

  return await downloads.getTicketsForOrder(event, order);
}

/**
 * Process order.
 * @param orderId
 * @returns {Promise<void>}
 */
async function processOrder(orderId) {
  // First, set download key
  await updateOrder(orderId, {
    $set: {
      'downloads.key': downloads.generateDownloadsKey(),
    },
  });

  // Send ticket mail
  await sendOrderTicketsEmail(orderId);

  // Set status to completed
  return await updateOrder(
    orderId,
    {
      status: ORDER_STATUSES.ORDER_STATUS_COMPLETED,
    },
    {
      new: true,
    }
  );
}

/**
 * Send order ticket il
 * @param orderId
 * @returns {Promise<void>}
 */
async function sendOrderTicketsEmail(orderId) {
  const order = await getOrder(orderId);

  if (!order) {
    throw new NotFoundError('order_not_found');
  }

  const pdfStream = await getOrderDownloads(orderId);
  const pdfBuffer = await streamToBuffer(pdfStream);

  await mail.sendBasicEmail(
    order.billingDetails.email,
    __('emails:yourTickets.subject'),
    __('emails:yourTickets.body', {
      ticketsUrl: `${config.get('URL')}/orders/${order._id}/downloads?key=${
        order.downloads.key
      }`,
    }),
    {
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `order${order._id}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'ticketpdf',
        },
      ],
    }
  );
}

// Necessary for cyclic dependency downloads.js
Object.assign(module.exports, {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderMeta,
  getOrderDownloads,
  processOrder,
  sendOrderTicketsEmail,
  serialize,
  deserialize,
});
