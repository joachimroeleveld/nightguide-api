const { Router } = require('express');

const { validator } = require('../shared/openapi');

const router = new Router();

router.get('/', validator.validate('get', '/health'), (req, res, next) => {
  res.json({ status: 'ok' });
});

module.exports = router;
