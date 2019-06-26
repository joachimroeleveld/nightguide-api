const _ = require('lodash');

exports.asyncMiddleware = function(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

exports.deserializeSort = function(param) {
  if (!param) {
    return null;
  }
  let sortArray = param;
  if (_.isString(param)) {
    sortArray = [param];
  }
  return sortArray.reduce((acc, item) => {
    const by = item.split(':')[0];
    const order = (item.split(':')[1] || 'desc') === 'desc' ? -1 : 1;
    acc[by] = order;
    return acc;
  }, {});
};
