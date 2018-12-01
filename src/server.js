const dotenv = require('dotenv');
dotenv.load();

const mongoose = require('mongoose');

const { isProduction } = require('./shared/config');
const routes = require('./routes');

if (isProduction && !!process.env.DEBUG_AGENT_ENABLED) {
  require('@google-cloud/debug-agent').start();
}

const { createExpressApp } = require('./framework/expressServer');

const PORT = process.env.PORT || 8080;

async function startServer() {
  const app = createExpressApp();

  // Add routes
  Object.keys(routes).forEach(key => {
    app.use(`/${key}`, routes[key]);
  });

  // Await DB connection
  mongoose
    .connect(
      process.env.MONGO_URI,
      { useNewUrlParser: true }
    )
    .then(() => {
      app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
      });
    })
    .catch(err => console.error(err));
}

startServer();
