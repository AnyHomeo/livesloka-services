const mongoose = require("mongoose");

var Invoice = new mongoose.Schema(
  {
    invoiceID: {
      trim: true,
      type: String,
    },
    refID: {
      trim: true,
      type: String,
    },
    invoiceDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    currentCustomerID: {
      trim: true,
      type: String,
    },
    customerName: {
      trim: true,
      type: String,
    },
    totalAmount: {
      trim: true,
      type: Number,
    },
    note: {
      trim: true,
      type: String,
    },
    classes: {
      type: [],
    },
    currency: {
      trim: true,
      type: String,
    },
    totalAmountINR: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", Invoice);
