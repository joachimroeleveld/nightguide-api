const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Mixed = mongoose.Mixed;

const Tag = require('../tags/tagModel');
const VenueImage = require('./venueImageModel');
const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_PRICE_CLASSES,
  VENUE_DOORPOLICIES,
  PAYMENT_METHODS,
} = require('../../shared/constants');
const { PointSchema, TranslatedSchema } = require('../../shared/schemas');

const VenueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: TranslatedSchema(),
    category: {
      type: String,
      enum: Object.values(VENUE_CATEGORIES),
    },
    images: [VenueImage.schema],
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
      coordinates: PointSchema(true),
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
      notes: TranslatedSchema(),
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

VenueSchema.method('sanitize', function() {
  const venue = this.toObject();

  venue.id = venue._id;
  delete venue._id;
  delete venue.__v;

  if (venue.images) {
    venue.images = venue.images.map(venueImage => venueImage.sanitize());
  }
  if (venue.tags && venue.tags.length && venue.tags[0] instanceof Tag) {
    venue.tags = venue.tags.map(tag => tag.sanitize());
  }

  return venue;
});

module.exports = mongoose.model('Venue', VenueSchema);
