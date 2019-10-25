if (process.env.TRACER_ENABLED === 'true') {
  require('@google-cloud/trace-agent').start();
}

const dotenv = require('dotenv');
dotenv.load();

const Sentry = require('@sentry/node');
const mongoose = require('mongoose');
const moment = require('moment');

const config = require('./shared/config');
const i18n = require('./framework/i18n');

if (config.getIsProduction()) {
  Sentry.init({ dsn: config.get('SENTRY_DSN') });
}

moment.locale('en');

const routes = require('./routes');

const { createExpressApp } = require('./framework/expressServer');

const PORT = config.get('PORT') || 8080;
const HOST = config.get('HOST') || undefined;

async function startServer() {
  const app = createExpressApp();

  // Add routes
  Object.keys(routes).forEach(key => {
    app.use(`/${key}`, routes[key]);
  });

  // Await DB connection
  mongoose
    .connect(config.get('MONGO_URI'), {
      useNewUrlParser: true,
      server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
      replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    })
    .then(i18n.init)
    .then(() => {
      app.listen(PORT, HOST, () => {
        console.log(`App listening on http://${HOST}:${PORT}`);
      });
    })
    .catch(err => console.error(err));
}

startServer();
