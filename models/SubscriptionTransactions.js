const mongoose = require('mongoose');

var SubscriptionTransactionsSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
    },

    type: {
      type: String,
      enum: ['PAYPAL', 'STRIPE'],
      default: 'PAYPAL',
    },
    planId: {
      type: String,
    },
    amount: {
      type: Date,
      default: null,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'Subscriptions',
  SubscriptionTransactionsSchema
);
