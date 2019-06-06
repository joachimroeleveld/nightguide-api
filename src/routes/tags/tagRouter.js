const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const tagRepository = require('./tagRepository');

const router = new Router();

router.get(
  '/',
  coerce('get', '/tags'),
  validator.validate('get', '/tags'),
  asyncMiddleware(async (req, res, next) => {
    let tags = await tagRepository.getTags({
      ids: req.query.ids,
      slugs: req.query.slugs,
    });

    const json = {
      results: tags.map(tag => tag.deserialize()),
      totalCount: tags.length,
    };

    res.json(json);
  })
);

router.get(
  '/:tagId',
  validator.validate('get', '/tags/{tagId}'),
  asyncMiddleware(async (req, res, next) => {
    const tag = await tagRepository.getTag(req.params.tagId);

    if (!tag) {
      throw new NotFoundError('tag_not_found');
    }

    res.json(tag.deserialize());
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/tags'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await tagRepository.serialize(req.body);
    const tag = await tagRepository.createTag(doc);

    res.status(201).json(tag.deserialize());
  })
);

router.put(
  '/:tagId',
  adminAuth(),
  validator.validate('put', '/tags/{tagId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await tagRepository.serialize(req.body);
    const tag = await tagRepository.updateTag(req.params.tagId, doc, {
      omitUndefined: true,
    });

    if (!tag) {
      throw new NotFoundError('tag_not_found');
    }

    res.json(tag.deserialize());
  })
);

router.delete(
  '/:tagId',
  adminAuth(),
  validator.validate('delete', '/tags/{tagId}'),
  asyncMiddleware(async (req, res, next) => {
    let tag = await tagRepository.getTag(req.params.tagId);

    if (!tag) {
      throw new NotFoundError('tag_not_found');
    }

    await tagRepository.deleteTag(req.params.tagId);

    res.json({ success: true });
  })
);

module.exports = router;
