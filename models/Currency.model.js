const mongoose = require("mongoose");

var CurrencySchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    currencyDesc: {
      type: String,
    },
    currencyName: {
      type: String,
    },
    currencyStatus: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Currency", CurrencySchema);
