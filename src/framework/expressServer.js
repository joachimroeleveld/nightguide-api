const express = require('express');
const bearerToken = require('express-bearer-token');
const morgan = require('morgan');

const middleware = require('./middleware');
const { isProduction } = require('../shared/config');
const { NotFoundError } = require('../shared/errors/index');
const routes = require('../routes/index');

function createExpressApp() {
  try {
    const app = express();

    const logFormat = isProduction ? 'combined' : 'dev';
    app.use(morgan(logFormat));

    app.set('view engine', 'hbs');
    app.set('views', './src/shared/templates');

    app.use(express.json());
    app.use(bearerToken());

    // Add routes
    Object.keys(routes).forEach(basePath => {
      app.use(`/${basePath}`, routes[basePath]);
    });

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
      next(
        new NotFoundError(
          'not_found',
          `Not Found: ${req.method} ${req.originalUrl}`
        )
      );
    });

    app.use(middleware.handleError());

    return app;
  } catch (e) {
    console.error('Error during startup: ', e);
    throw e;
  }
}

module.exports = {
  createExpressApp,
};
