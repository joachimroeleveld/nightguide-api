const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { serialize, deserialize } = require('./lib/serialization');

const { translatedSchema, pointSchema } = require('../../shared/schemas');

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    organiser: {
      type: {
        type: String,
        enum: ['venue'],
      },
      venue: {
        type: String,
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
    date: {
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
        required: true,
      },
    },
    images: [{ type: String, ref: 'VenueImage' }],
    description: translatedSchema,
    queryText: String,
  },
  {
    timestamps: true,
  }
);

EventSchema.static('serialize', serialize);
EventSchema.static('deserialize', deserialize);

EventSchema.method('deserialize', function() {
  return EventSchema.statics.deserialize(this);
});

module.exports = mongoose.model('Event', EventSchema);
