const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;

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

const weekSchema = new mongoose.Schema(
  {
    mon: Mixed,
    tue: Mixed,
    wed: Mixed,
    thu: Mixed,
    fri: Mixed,
    sat: Mixed,
    sun: Mixed,
  },
  { _id: false }
);

module.exports = {
  pointSchema,
  translatedSchema,
  weekSchema,
};
