const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  { _id: false }
);

const translatedSchema = new mongoose.Schema(
  {
    en: String,
    nl: String,
  },
  { _id: false }
);

module.exports = {
  pointSchema,
  translatedSchema,
};
