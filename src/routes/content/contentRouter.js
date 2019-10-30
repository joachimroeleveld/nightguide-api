const { Router } = require('express');
const multer = require('multer');

const { deserializeSort } = require('../../shared/util/expressUtils');
const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const contentRepository = require('./contentRepository');

const upload = multer();
const router = new Router();

router.get(
  '/',
  coerce('get', '/content'),
  validator.validate('get', '/content'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const populate = req.query.populate || ['images'];

    const { results, totalCount } = await contentRepository.getContent(
      {
        offset,
        limit,
        fields: req.query.fields,
        populate,
        type: req.query.type,
        query: req.query.query,
        ids: req.query.ids,
        pageSlug: req.query.pageSlug,
        sortBy: deserializeSort(req.query.sortBy),
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
  coerce('get', '/content/{contentId}'),
  validator.validate('get', '/content/{contentId}'),
  asyncMiddleware(async (req, res, next) => {
    const populate = req.query.populate || ['images'];

    const doc = await contentRepository.getContentSingle(req.params.contentId, {
      populate,
    });

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
    const content = await contentRepository.getContentSingle(
      req.params.contentId
    );
    if (!content) {
      throw new NotFoundError('content_not_found');
    }

    for (const imageId of content.images) {
      await contentRepository.deleteContentImageById(
        req.params.contentId,
        imageId
      );
    }

    await contentRepository.deleteContentSingle(req.params.contentId);

    res.json({ success: true });
  })
);

router.get(
  '/slug/:slug',
  validator.validate('get', '/content/slug/{slug}'),
  asyncMiddleware(async (req, res, next) => {
    const populate = req.query.populate || ['images'];

    const doc = await contentRepository.getContentByUrlSlug(req.params.slug, {
      populate,
    });

    if (!doc) {
      throw new NotFoundError('content_not_found');
    }

    res.json(doc.deserialize());
  })
);

router.post(
  '/:contentId/images',
  adminAuth(),
  validator.validate('post', '/content/{contentId}/images'),
  upload.array('images', 10),
  asyncMiddleware(async (req, res, next) => {
    const content = await contentRepository.getContent(req.params.contentId);
    if (!content) {
      throw new NotFoundError('content_not_found');
    }

    let promises;
    if (req.files) {
      promises = req.files.map(file => {
        return contentRepository.uploadContentImage(req.params.contentId, {
          buffer: file.buffer,
          mime: file.mimetype,
        });
      });
    } else {
      promises = req.body.images.map(image =>
        contentRepository.uploadContentImageByUrl(req.params.contentId, image)
      );
    }

    let images = await Promise.all(promises);
    const results = images.map(image => image.deserialize());

    res.status(200).json({ results });
  })
);

router.delete(
  '/:contentId/images/:imageId',
  adminAuth(),
  validator.validate('delete', '/content/{contentId}/images/{imageId}'),
  asyncMiddleware(async (req, res, next) => {
    const content = await contentRepository.getContentSingle(
      req.params.contentId
    );

    if (!content) {
      throw new NotFoundError('content_not_found');
    }
    if (!content.images || !content.images.includes(req.params.imageId)) {
      throw new NotFoundError('image_not_found');
    }

    await contentRepository.deleteContentImageById(
      req.params.contentId,
      req.params.imageId
    );

    res.json({ success: true });
  })
);

module.exports = router;
