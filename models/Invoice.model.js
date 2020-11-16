const mongoose = require("mongoose");

var Invoice = new mongoose.Schema(
  {
    invoiceID: {
      type: String,
    },
    refID: {
      type: String,
    },
    invoiceDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    currentCustomerID: {
      type: String,
    },
    customerName: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    note: {
      type: String,
    },
    classes: {
      type: [],
    },
    currency: {
      type: String,
    },
    totalAmountINR: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", Invoice);
