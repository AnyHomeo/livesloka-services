const mongoose = require('mongoose');

var RewardHistorySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    previousValue: {
      type: Number,
    },
    nextValue: {
      type: Number,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RewardHistory', RewardHistorySchema);
