const mongoose = require('mongoose');

var ClassHistorySchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    previousStatus: {
      type: String,
    },
    nextStatus: {
      type: String,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClassHistory', ClassHistorySchema);
