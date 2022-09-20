const mongoose = require('mongoose');

var ExtraAmountsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      unique: true,
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
    comment: {
      type: String,
    },
    amount: {
      type: Number,
    },
    teacherId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExtraAmounts', ExtraAmountsSchema);
