const mongoose = require('mongoose');

function match(agg, filter) {
  const { ids, status } = filter;

  const match = {};
  if (ids) {
    match._id = { $in: ids.map(id => mongoose.Types.ObjectId(id)) };
  }
  if (status) {
    match.status = { $in: status };
  }
  agg.match(match);

  return agg;
}

module.exports = {
  match,
};
