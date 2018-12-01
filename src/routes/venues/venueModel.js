const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Mixed = mongoose.Mixed;

const VenueImage = require('./venueImageModel');
const {
  VENUE_CATEGORIES,
  COUNTRIES,
  VENUE_PRICE_CLASSES,
  VENUE_DOORPOLICIES,
  PAYMENT_METHODS,
} = require('../../shared/constants');
const { PointSchema, getWeekSchema } = require('../../shared/schemas');

const VenueContactSchema = new Schema({
  name: String,
  emailAddress: String,
  phone: String,
  notes: String,
});

const VenueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
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
      coordinates: PointSchema,
    },
    contactInfo: VenueContactSchema,
    website: String,
    facebook: {
      pageUrl: String,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    doorPolicy: {
      policy: {
        type: String,
        enum: Object.values(VENUE_DOORPOLICIES),
      },
      notes: String,
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
      methods: Object.values(PAYMENT_METHODS),
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

  venue.images = venue.images.map(venueImage => venueImage.sanitize());
  venue.tags = venue.tags.map(tag => tag.sanitize());

  return venue;
});

module.exports = mongoose.model('Venue', VenueSchema);
