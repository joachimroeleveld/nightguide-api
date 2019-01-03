const { Router } = require('express');

const { standardAuth } = require('../../shared/auth');
const { asyncMiddleware } = require('../../shared/util/expressUtils');
const mail = require('../../shared/services/mail');
const validator = require('../../shared/validator');
const { FEEDBACK_EMAIL } = require('../../shared/constants');

const router = new Router();

router.post(
  '/user-feedback',
  standardAuth(),
  validator.validate('post', '/misc/user-feedback'),
  asyncMiddleware(async (req, res, next) => {
    await mail.sendBasicEmail(
      FEEDBACK_EMAIL,
      'User app feedback',
      `
<strong>User ${req.user.email} sent you message:</strong><br/>
<br/>
<p style="font-style:italic;">${req.body.message}</p>    
    `,
      {
        replyTo: req.user.email,
      }
    );

    res.json({ success: true });
  })
);

module.exports = router;
