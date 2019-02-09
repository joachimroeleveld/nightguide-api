const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Mixed = mongoose.Mixed;
const _ = require('lodash');

const VenueImage = require('./venueImageModel');
const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_PRICE_CLASSES,
  VENUE_DOORPOLICIES,
  VENUE_PAYMENT_METHODS,
  VENUE_MUSIC_TYPES,
  VENUE_VISITOR_TYPES,
} = require('../../shared/constants');
const { pointSchema, translatedSchema } = require('../../shared/schemas');

const VenueSchema = new Schema(
  {
    sourceId: Number, // Airtable ID
    name: {
      type: String,
      required: true,
    },
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
      notes: translatedSchema,
    },
    prices: {
      class: {
        type: Number,
        enum: Object.values(VENUE_PRICE_CLASSES),
      },
    },
    vip: {
      hasVipArea: Boolean,
    },
    smoking: {
      hasSmokingArea: Boolean,
    },
    timeline: {
      dineUntil: Mixed,
      bitesUntil: Mixed,
      drinksFrom: Mixed,
      partyFrom: Mixed,
      closedAt: Mixed,
    },
    wardrobe: {
      hasSecuredWardrobe: Boolean,
    },
    outdoorSeating: {
      hasOutdoorSeating: Boolean,
      hasHeaters: Boolean,
    },
    capacity: {
      amount: Number,
    },
    payment: {
      methods: {
        type: String,
        enum: Object.values(VENUE_PAYMENT_METHODS),
      },
    },
    entranceFee: {
      charge: Mixed,
    },
    parking: {
      hasParking: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

VenueSchema.index({ 'location.coordinates': '2dsphere' });
VenueSchema.index({ name: 'text' });

VenueSchema.static('serialize', data => {
  if (data.location && data.location.coordinates) {
    data.location.coordinates = {
      type: 'Point',
      coordinates: [
        data.location.coordinates.longitude,
        data.location.coordinates.latitude,
      ],
    };
  }
  return data;
});

VenueSchema.static('deserialize', venue => {
  if (venue.toObject) {
    venue = venue.toObject();
  } else {
    venue = _.cloneDeep(venue);
  }

  venue.id = venue._id;
  delete venue._id;
  delete venue.__v;
  delete venue.sourceId;

  if (venue.images) {
    venue.images = venue.images.map(VenueImage.deserialize);
  }
  if (venue.location && venue.location.coordinates) {
    const longitude = venue.location.coordinates.coordinates[0];
    const latitude = venue.location.coordinates.coordinates[1];
    venue.location.coordinates = {
      longitude,
      latitude,
    };
  }

  return venue;
});

VenueSchema.method('deserialize', function() {
  return VenueSchema.statics.deserialize(this);
});

module.exports = mongoose.model('Venue', VenueSchema);
