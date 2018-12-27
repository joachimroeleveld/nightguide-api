const dotenv = require('dotenv');
dotenv.load();

const mongoose = require('mongoose');

const config = require('./shared/config');
const routes = require('./routes');

if (config.getIsProduction() && !!config.get('DEBUG_AGENT_ENABLED')) {
  require('@google-cloud/debug-agent').start();
}

const { createExpressApp } = require('./framework/expressServer');

const PORT = config.get('PORT') || 8080;

async function startServer() {
  const app = createExpressApp();

  // Add routes
  Object.keys(routes).forEach(key => {
    app.use(`/${key}`, routes[key]);
  });

  // Await DB connection
  mongoose
    .connect(
      config.get('MONGO_URI'),
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
