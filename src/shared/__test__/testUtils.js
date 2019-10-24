const mongoose = require('mongoose');
const _ = require('lodash');

const { deepFreeze } = require('../util/objects');

function generateMongoFixture(base, overrides) {
  return deepFreeze({
    ...base,
    _id: new mongoose.Types.ObjectId().toString(),
    ...overrides,
  });
}

async function resetDb() {
  const removals = Object.keys(mongoose.connection.collections).map(
    collection =>
      new Promise(resolve =>
        mongoose.connection.collections[collection].remove(resolve)
      )
  );

  let dropIndices = [];
  // dropIndices = Object.keys(mongoose.connection.collections).map(
  //   collection =>
  //     new Promise(resolve =>
  //       mongoose.connection.collections[collection].dropAllIndexes(resolve)
  //     )
  // );

  await Promise.all(_.flatten([removals, dropIndices]));
}

function setFixtureLocation(fixture, coordinates) {
  return {
    ...fixture,
    location: {
      ...fixture.location,
      coordinates: {
        type: 'Point',
        coordinates: coordinates,
      },
    },
  };
}

module.exports = {
  resetDb,
  setFixtureLocation,
  generateMongoFixture,
};
