const path = require('path');
const sgMail = require('@sendgrid/mail');

const config = require('../config');
const hbs = require('../../framework/hbs');

sgMail.setApiKey(config.get('SENDGRID_API_KEY'));

const BASIC_TEMPLATE_PATH = path.resolve(
  __dirname,
  '../templates/mail/basic.html'
);

async function sendBasicEmail(toEmail, subject, body, opts) {
  const html = await hbs.render(BASIC_TEMPLATE_PATH, {
    staticUrl: config.get('STATIC_URL'),
    heading: subject,
    body,
  });

  const msg = {
    to: toEmail,
    from: 'noreply@nightguide.app',
    subject,
    html,
    ...opts,
  };

  return sgMail.send(msg);
}

module.exports = {
  sendBasicEmail,
};
