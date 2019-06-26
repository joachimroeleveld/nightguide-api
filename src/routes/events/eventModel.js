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
        _id: false,
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
        },
      },
    ],
    repeat: {}, // TODO
    images: [{ type: String, ref: 'EventImage' }],
    description: translatedSchema,
    facebook: {
      id: String,
      title: String,
      description: String,
      interestedCount: Number,
      goingCount: Number,
    },
    queryText: String,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ 'facebook.id': 1 }, { sparse: true, unique: true });
EventSchema.index({ 'organiser.venue': 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ queryText: 'text' });

EventSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Event', EventSchema);
