const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const { validator, coerce } = require('../../shared/openapi');
const { NotFoundError } = require('../../shared/errors');
const configRepository = require('./configRepository');

const router = new Router();

router.get(
  '/',
  coerce('get', '/configs'),
  validator.validate('get', '/configs'),
  asyncMiddleware(async (req, res, next) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const { results, totalCount } = await configRepository.getConfigs(
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
      results: results.map(configRepository.deserialize),
      totalCount,
    };

    res.json(json);
  })
);

router.get(
  '/:configId',
  validator.validate('get', '/configs/{configId}'),
  asyncMiddleware(async (req, res, next) => {
    const config = await configRepository.getConfig(req.params.configId);

    if (!config) {
      throw new NotFoundError('config_not_found');
    }

    res.json(config.deserialize());
  })
);

router.post(
  '/',
  adminAuth(),
  validator.validate('post', '/configs'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await configRepository.serialize(req.body);
    const config = await configRepository.createConfig(doc);

    res.status(201).json(config.deserialize());
  })
);

router.put(
  '/:configId',
  adminAuth(),
  validator.validate('put', '/configs/{configId}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await configRepository.serialize(req.body);
    const config = await configRepository.updateConfig(
      req.params.configId,
      doc,
      {
        omitUndefined: true,
      }
    );

    if (!config) {
      throw new NotFoundError('config_not_found');
    }

    res.json(config.deserialize());
  })
);

router.delete(
  '/:configId',
  adminAuth(),
  validator.validate('delete', '/configs/{configId}'),
  asyncMiddleware(async (req, res, next) => {
    let config = await configRepository.getConfig(req.params.configId);

    if (!config) {
      throw new NotFoundError('config_not_found');
    }

    await configRepository.deleteConfig(req.params.configId);

    res.json({ success: true });
  })
);

router.get(
  '/name/:configName',
  validator.validate('get', '/configs/name/{configName}'),
  asyncMiddleware(async (req, res, next) => {
    const doc = await configRepository.getConfigByName(
      req.params.configName,
      req.query.pageSlug
    );

    if (!doc) {
      throw new NotFoundError('config_not_found');
    }

    res.json(doc.deserialize());
  })
);

module.exports = router;
