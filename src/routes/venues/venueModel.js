const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_DOORPOLICIES,
  VENUE_PAYMENT_METHODS,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
  VENUE_DRESSCODES,
  VENUE_FACILITIES,
} = require('../../shared/constants');
const {
  pointSchema,
  translatedSchema,
  weekSchema,
} = require('../../shared/schemas');
const {
  serialize,
  deserialize,
  getCapacityRange,
  getPriceClass,
} = require('./lib/serialization');

const VenueSchema = new Schema(
  {
    sourceId: Number, // Airtable ID
    name: {
      type: String,
      required: true,
    },
    queryText: String,
    description: translatedSchema,
    categories: [
      {
        type: String,
        enum: Object.values(VENUE_CATEGORIES),
      },
    ],
    images: [{ type: String, ref: 'VenueImage' }],
    location: {
      address1: String,
      address2: String,
      postalCode: String,
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        enum: Object.values(COUNTRIES),
      },
      coordinates: {
        type: pointSchema,
        required: true,
      },
      googlePlaceId: String,
    },
    website: String,
    facebook: {
      id: String,
    },
    instagram: {
      id: String,
      explorePage: String,
    },
    twitterHandle: String,
    musicTypes: [
      {
        type: String,
        enum: Object.values(VENUE_MUSIC_TYPES),
      },
    ],
    visitorTypes: [
      {
        type: String,
        enum: Object.values(VENUE_VISITOR_TYPES),
      },
    ],
    doorPolicy: {
      policy: {
        type: String,
        enum: Object.values(VENUE_DOORPOLICIES),
      },
      description: translatedSchema,
    },
    prices: Object,
    timeSchedule: {
      open: weekSchema,
      kitchen: weekSchema,
      terrace: weekSchema,
      bitesUntil: weekSchema,
      drinksFrom: weekSchema,
      busyFrom: weekSchema,
      dancingFrom: weekSchema,
    },
    capacity: Number,
    paymentMethods: [
      {
        type: String,
        enum: Object.values(VENUE_PAYMENT_METHODS),
      },
    ],
    fees: {
      entrance: Number,
      coatCheck: Number,
    },
    dresscode: {
      type: String,
      enum: Object.values(VENUE_DRESSCODES),
    },
    facilities: [
      {
        type: String,
        enum: Object.values(VENUE_FACILITIES),
      },
    ],
  },
  {
    timestamps: true,
  }
);

VenueSchema.index({ 'location.coordinates': '2dsphere' });
VenueSchema.index({ name: 'text' });

VenueSchema.virtual('capacityRange').get(function() {
  return getCapacityRange(this);
});
VenueSchema.virtual('priceClass').get(function() {
  return getPriceClass(this);
});

VenueSchema.static('serialize', serialize);
VenueSchema.static('deserialize', deserialize);

VenueSchema.method('deserialize', function() {
  return VenueSchema.statics.deserialize(this);
});

module.exports = mongoose.model('Venue', VenueSchema);
