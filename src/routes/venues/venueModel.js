const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Mixed = mongoose.Mixed;
const _ = require('lodash');

const Tag = require('../tags/tagModel');
const VenueImage = require('./venueImageModel');
const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_PRICE_CLASSES,
  VENUE_DOORPOLICIES,
  PAYMENT_METHODS,
} = require('../../shared/constants');
const { pointSchema, translatedSchema } = require('../../shared/schemas');

const VenueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: translatedSchema,
    category: {
      type: String,
      enum: Object.values(VENUE_CATEGORIES),
    },
    images: [{ type: String, ref: 'VenueImage' }],
    location: {
      address: String,
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
      pageUrl: String,
    },
    tags: [{ type: String, ref: 'Tag' }],
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
        enum: Object.values(PAYMENT_METHODS),
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

  if (venue.images) {
    venue.images = venue.images.map(VenueImage.deserialize);
  }
  if (venue.tags && venue.tags.length && venue.tags[0] instanceof Tag) {
    venue.tags = venue.tags.map(Tag.deserialize);
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
