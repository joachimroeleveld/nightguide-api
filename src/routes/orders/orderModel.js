const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { ORDER_STATUSES } = require('../../shared/constants');
const { deserialize } = require('./lib/serialization');

const OrderSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(ORDER_STATUSES),
    },
    billingDetails: {
      email: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      address: {
        city: String,
        country: {
          type: String,
          required: true,
        },
        line1: String,
        line2: String,
        postalCode: String,
        state: String,
      },
    },
    items: [
      {
        eventId: String,
        sku: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          required: true,
        },
      },
    ],
    paymentMethod: {
      type: {
        type: String,
        required: true,
      },
      ideal: {
        bank: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Order', OrderSchema);
