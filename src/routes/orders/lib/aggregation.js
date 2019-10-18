const mongoose = require('mongoose');

function match(agg, filter) {
  const { ids, query } = filter;

  const match = {};
  if (ids) {
    match._id = { $in: ids.map(id => mongoose.Types.ObjectId(id)) };
  }
  agg.match(match);

  return agg;
}

module.exports = {
  match,
};
