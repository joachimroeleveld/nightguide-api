const { Router } = require('express');

const { adminAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const mail = require('../../shared/services/mail');
const { validator } = require('../../shared/openapi');
const { FEEDBACK_EMAIL } = require('../../shared/constants');
const cityConfig = require('../../shared/cityConfig');

const router = new Router();

router.post(
  '/user-feedback',
  validator.validate('post', '/misc/user-feedback'),
  asyncMiddleware(async (req, res, next) => {
    const user = req.user ? req.user.email : 'Anonymous';
    await mail.sendBasicEmail(
      FEEDBACK_EMAIL,
      'User app feedback',
      `
<strong>User ${user} sent you message:</strong><br/>
<br/>
<p style="font-style:italic;">${req.body.message}</p>    
    `,
      {
        replyTo: req.user ? req.user.email : undefined,
      }
    );

    res.json({ success: true });
  })
);

router.get(
  '/city-config',
  adminAuth(),
  asyncMiddleware(async (req, res, next) => {
    res.json(cityConfig.config);
  })
);

module.exports = router;
