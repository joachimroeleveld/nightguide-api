const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { deserialize } = require('./lib/serialization');

const { translatedSchema, pointSchema } = require('../../shared/schemas');

const EventSchema = new Schema(
  {
    title: String,
    organiser: {
      venue: {
        type: Schema.Types.ObjectId,
        ref: 'Venue',
      },
    },
    location: {
      type: {
        type: String,
        enum: ['venue', 'address'],
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      address1: String,
      address2: {
        type: String,
      },
      postalCode: {
        type: String,
        required: true,
      },
      coordinates: {
        type: pointSchema,
        required: true,
      },
    },
    dates: [
      {
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
        },
        interestedCount: Number,
        ticketsUrl: String,
        providerEventId: String,
        artists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
        isHot: Boolean,
      },
    ],
    images: [{ type: String, ref: 'Image' }],
    videoUrl: String,
    description: translatedSchema,
    facebook: {
      id: String,
      title: String,
      description: String,
      datesChanged: Boolean,
    },
    queryText: String,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
    pageSlug: {
      type: String,
      required: true,
    },
    tickets: {
      products: [
        {
          name: String,
          price: {
            type: Number,
            required: true,
          },
        },
      ],
      checkoutUrl: String,
      provider: String,
      providerData: Object,
      displayPrice: Number,
      soldOut: Boolean,
      doorSale: Boolean,
      free: Boolean,
      qrCode: Boolean,
      qrCodeInfo: translatedSchema,
      guestList: Boolean,
      guestListInfo: translatedSchema,
    },
    admin: {
      hide: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ 'facebook.id': 1 }, { sparse: true, unique: true });
EventSchema.index({ 'organiser.venue': 1 });
EventSchema.index({ tags: 1 });

EventSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Event', EventSchema);
