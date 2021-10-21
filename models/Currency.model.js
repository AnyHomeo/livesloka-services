const mongoose = require("mongoose");

var CurrencySchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    currencyDesc: {
      trim: true,
      type: String,
    },
    currencyName: {
      trim: true,
      type: String,
    },
    currencyStatus: {
      trim: true,
      type: String,
    },
    prefix:{
      type:String,
      default:"$"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Currency", CurrencySchema);
