const mongoose = require('mongoose');
const _ = require('lodash');

function isPopulated(object) {
  let subject = Array.isArray(object) ? object[0] : object;
  return (
    !!subject &&
    !(subject instanceof mongoose.Types.ObjectId) &&
    !_.isString(subject)
  );
}

module.exports = {
  isPopulated,
};
