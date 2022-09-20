const mongoose = require('mongoose');

var PaypalTransactionsSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    paymentData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaypalTransactions', PaypalTransactionsSchema);
