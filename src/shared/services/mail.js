const fs = require('fs');
const path = require('path');
const Handlebars = require('hbs');
const sgMail = require('@sendgrid/mail');

const hbs = Handlebars.create();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const templateFile = fs.readFileSync(
  path.resolve(__dirname, '../templates/mail/basic.html'),
  'utf-8'
);
const template = hbs.compile(templateFile);

function sendBasicEmail(toEmail, subject, body) {
  const html = template({
    heading: subject,
    body,
  });

  const msg = {
    to: toEmail,
    from: 'noreply@nightguide.app',
    subject,
    html,
  };

  return sgMail.send(msg);
}

module.exports = {
  sendBasicEmail,
};
