const mongoose = require('mongoose');

var ExchangeRateSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    from: {
      trim: true,
      type: String,
    },
    to: {
      trim: true,
      type: String,
    },
    date: {
      type: Date,
    },
    rate: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
