const mongoose = require('mongoose');

async function clearDb() {
  const removals = Object.keys(mongoose.connection.collections).map(
    collection =>
      new Promise(resolve =>
        mongoose.connection.collections[collection].remove(resolve)
      )
  );

  return Promise.all(removals);
}

module.exports = {
  clearDb,
};
