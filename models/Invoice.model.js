const mongoose = require("mongoose");

var Invoice = new mongoose.Schema({
  invoiceID: {
    type: String,
  },
  refID: {
    type: String,
  },
  invoiceDate: {
    type: String,
  },
  dueDate: {
    type: String,
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
});

module.exports = mongoose.model("Invoice", Invoice);
