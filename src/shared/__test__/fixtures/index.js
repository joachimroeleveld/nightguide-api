const mongoose = require('mongoose');

const { deepFreeze } = require('../../util/objects');

function generateMongoFixture(base, overrides) {
  return deepFreeze({
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
  ...require('./artistFixtures'),
  ...require('./tagFixtures'),
  generateMongoFixture,
};
