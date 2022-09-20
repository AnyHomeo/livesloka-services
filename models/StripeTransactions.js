const mongoose = require('mongoose');

var StripeTransactionsSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    stripeCustomer: {
      type: String,
    },
    paymentData: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['FAIL', 'SUCCESS'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StripeTransactions', StripeTransactionsSchema);
