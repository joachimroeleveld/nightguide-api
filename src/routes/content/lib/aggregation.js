const mongoose = require('mongoose');

function match(agg, filter) {
  const { ids, query, pageSlug, type } = filter;

  const match = {};
  if (type) {
    match['type'] = type;
  }
  if (ids) {
    match._id = { $in: ids.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (query && query.length >= 2) {
    match.name = new RegExp(`\\b${query}`, 'i');
  }
  if (pageSlug) {
    match['pageSlug'] = pageSlug;
  }
  agg.match(match);

  return agg;
}

module.exports = {
  match,
};
