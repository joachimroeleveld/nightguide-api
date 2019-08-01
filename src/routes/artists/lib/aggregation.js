const mongoose = require('mongoose');

function match(agg, { ids, query }) {
  const match = {};
  if (ids) {
    match._id = { $in: ids.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (query && query.length >= 2) {
    match.name = new RegExp(`\\b${query}`, 'i');
  }
  agg.match(match);

  return agg;
}

module.exports = {
  match,
};
