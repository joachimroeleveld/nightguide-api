const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const contentRepository = require('./contentRepository');

const router = new Router();

router.get(
  '/',
  coerce('get', '/content'),
  validator.validate('get', '/content'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const { results, totalCount } = await contentRepository.getContent(
      {
        offset,
        limit,
        type: req.query.type,
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
  '/',
  adminAuth(),
  validator.validate('post', '/content'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.createContent(
      contentRepository.serialize(req.body)
    );

    res.status(201).json(doc.deserialize());
  })
);

router.get(
  '/:contentId',
  validator.validate('get', '/content/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.getContentSingle(req.params.contentId);

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

router.put(
  '/:contentId',
  adminAuth(),
  validator.validate('put', '/content/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.updateContentSingle(
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
  '/:contentId',
  adminAuth(),
  validator.validate('delete', '/content/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    await contentRepository.deleteContentSingle(req.params.contentId);

    res.json({ success: true });
  })
);

router.get(
  '/slug/:slug',
  validator.validate('get', '/content/slug/{slug}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await contentRepository.getContentByUrlSlug(req.params.slug);

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

module.exports = router;
