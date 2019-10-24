const { Router } = require('express');
const _ = require('lodash');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError, UnauthorizedError } = require('../../shared/errors');
const orderRepository = require('./orderRepository');

const router = new Router();

router.get(
  '/',
  adminAuth(),
  coerce('get', '/orders'),
  validator.validate('get', '/orders'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const { results, totalCount } = await orderRepository.getOrders(
      {
        offset,
        limit,
        ids: req.query.ids,
        status: req.query.status,
      },
      true
    );

    const json = {
      offset,
      limit,
      results: results.map(orderRepository.deserialize),
      totalCount,
    };

    res.json(json);
  })
);

router.get(
  '/:orderId',
  adminAuth(),
  validator.validate('get', '/orders/{orderId}'),
  asyncMiddleware(async (req, res, next) => {
    const order = await orderRepository.getOrder(req.params.orderId);

    if (!order) {
      throw new NotFoundError('order_not_found');
    }

    res.json(order.deserialize());
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/orders'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await orderRepository.serialize(req.body);
    const order = await orderRepository.createOrder(doc);

    res.status(201).json(order.deserialize());
  })
);

router.put(
  '/:orderId',
  adminAuth(),
  validator.validate('put', '/orders/{orderId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await orderRepository.serialize(req.body);
    const order = await orderRepository.updateOrder(req.params.orderId, doc, {
      omitUndefined: true,
    });

    if (!order) {
      throw new NotFoundError('order_not_found');
    }

    res.json(order.deserialize());
  })
);

router.delete(
  '/:orderId',
  adminAuth(),
  validator.validate('delete', '/orders/{orderId}'),
  asyncMiddleware(async (req, res, next) => {
    let order = await orderRepository.getOrder(req.params.orderId);

    if (!order) {
      throw new NotFoundError('order_not_found');
    }

    await orderRepository.deleteOrder(req.params.orderId);

    res.json({ success: true });
  })
);

router.put(
  '/:orderId/metadata/:metaKey',
  adminAuth(),
  validator.validate('put', '/orders/{orderId}/metadata/{metaKey}'),
  asyncMiddleware(async (req, res, next) => {
    const meta = await orderRepository.updateOrderMeta(
      req.params.orderId,
      req.params.metaKey,
      req.body.value
    );

    res.json(meta);
  })
);

router.get(
  '/:orderId/downloads',
  validator.validate('get', '/orders/{orderId}/downloads'),
  asyncMiddleware(async (req, res, next) => {
    let order = await orderRepository.getOrder(req.params.orderId);

    if (!order) {
      throw new NotFoundError('order_not_found');
    }
    if (_.get(order, 'downloads.key') !== req.query.key) {
      throw new UnauthorizedError('invalid_key');
    }

    const stream = await orderRepository.getOrderDownloads(req.params.orderId);

    res.set('Content-type', 'application/pdf');
    // View inline when in development
    if (process.env.NODE_ENV !== 'development') {
      res.set(
        'Content-Disposition',
        `attachment; filename="order${order._id}.pdf"`
      );
    }
    stream.pipe(res);
  })
);

module.exports = router;
