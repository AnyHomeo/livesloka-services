const mongoose = require("mongoose");

var ExpensesSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    gst: {
      type: Number,
      default: 0,
    },
    dollarAmount: {
      type: String,
      default: 0,
    },
    indianAmount: {
      type: String,
      default: 0,
    },
    attachment: {
      type: String,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expenses", ExpensesSchema);
