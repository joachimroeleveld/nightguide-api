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
      email: String,
      name: String,
      address: {
        city: String,
        country: String,
        line1: String,
        line2: String,
        postalCode: String,
        state: String,
      },
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    items: [
      {
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
      },
    ],
    downloads: {
      key: String,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

OrderSchema.method('deserialize', function() {
  return deserialize(this);
});

module.exports = mongoose.model('Order', OrderSchema);
