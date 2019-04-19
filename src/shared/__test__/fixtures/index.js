const mongoose = require('mongoose');

function generateMongoFixture(base, overrides) {
  return Object.freeze({
    ...base,
    _id: new mongoose.Types.ObjectId().toString(),
    ...overrides,
  });
}

module.exports = {
  ...require('./userFixtures'),
  ...require('./venueFixtures'),
  ...require('./eventFixtures'),
  ...require('./locationFixtures'),
  generateMongoFixture,
};
