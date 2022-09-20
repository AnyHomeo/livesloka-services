const mongoose = require('mongoose');

var TransactionsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    mode: {
      type: String,
      default: 'PAYPAL',
      enum: ['PAYPAL', 'RAZORPAY', 'OTHERS'],
    },
    date: {
      required: true,
      type: Date,
    },
    amount: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transactions', TransactionsSchema);
