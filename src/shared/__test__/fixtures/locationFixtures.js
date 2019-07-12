const { deepFreeze } = require('../../util/objects');

const COORDINATES_UTRECHT = deepFreeze([5.085487, 52.118273]);
const COORDINATES_WOERDEN = deepFreeze([4.873716, 52.083686]);
const COORDINATES_THE_HAGUE = deepFreeze([4.282958, 52.072532]);

module.exports = {
  COORDINATES_THE_HAGUE,
  COORDINATES_UTRECHT,
  COORDINATES_WOERDEN,
};
