const mongoose = require('mongoose');
const _ = require('lodash');

async function clearDb() {
  const removals = Object.keys(mongoose.connection.collections).map(
    collection =>
      new Promise(resolve =>
        mongoose.connection.collections[collection].remove(resolve)
      )
  );
  const dropIndices = Object.keys(mongoose.connection.collections).map(
    collection =>
      new Promise(resolve =>
        mongoose.connection.collections[collection].dropAllIndexes(resolve)
      )
  );

  return Promise.all(_.flatten([removals, dropIndices]));
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
  clearDb,
  setFixtureLocation,
};
