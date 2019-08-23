const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const contentRepository = require('./contentRepository');

const router = new Router();

router.get(
  '/:contentType',
  coerce('get', '/content/{contentType}'),
  validator.validate('get', '/content/{contentType}'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const { results, totalCount } = await contentRepository.getContent(
      req.params.contentType,
      {
        offset,
        limit,
        query: req.query.query,
        ids: req.query.ids,
        pageSlug: req.query.pageSlug,
      },
      true
    );

    const json = {
      offset,
      limit,
      results: results.map(contentRepository.deserialize),
      totalCount,
    };

    res.json(json);
  })
);

router.post(
  '/:contentType',
  adminAuth(),
  validator.validate('post', '/content/{contentType}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.createContent(
      req.params.contentType,
      contentRepository.serialize(req.body)
    );

    res.status(201).json(doc.deserialize());
  })
);

router.get(
  '/:contentType/:contentId',
  adminAuth(),
  validator.validate('get', '/content/{contentType}/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.getContentSingle(
      req.params.contentType,
      req.params.contentId
    );

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

router.put(
  '/:contentType/:contentId',
  adminAuth(),
  validator.validate('put', '/content/{contentType}/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.updateContentSingle(
      req.params.contentType,
      req.params.contentId,
      contentRepository.serialize(req.body)
    );

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

router.delete(
  '/:contentType/:contentId',
  adminAuth(),
  validator.validate('delete', '/content/{contentType}/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    await contentRepository.deleteContentSingle(
      req.params.contentType,
      req.params.contentId
    );

    res.json({ success: true });
  })
);

router.get(
  '/:contentType/slug/:slug',
  adminAuth(),
  validator.validate('get', '/content/{contentType}/slug/{slug}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.getContentByUrlSlug(
      req.params.contentType,
      req.params.slug
    );

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

module.exports = router;
