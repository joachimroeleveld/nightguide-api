const _ = require('lodash');

/**
 * Prepare artist object to be sent to client.
 * @returns {Event}
 */
function deserialize(artist) {
  if (artist.toObject) {
    artist = artist.toObject();
  } else {
    artist = _.cloneDeep(artist);
  }

  artist.id = artist._id;
  delete artist._id;

  return artist;
}

/**
 * Prepare artist object for database insertion.
 * @param artist
 */
async function serialize(artist) {
  if (artist.id) {
    artist._id = artist.id;
    delete artist.id;
  }

  return artist;
}

module.exports = {
  deserialize,
  serialize,
};
