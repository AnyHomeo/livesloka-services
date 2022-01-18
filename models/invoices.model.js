const mongoose = require("mongoose");
const counter = require("./AutoIncrement.model");

const InvoicesSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  country: {
    type: String,
  },
  items: [
    {
      description: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      amount: {
        type: Number,
      },
    },
  ],
});

entitySchema.pre("save", function (next) {
  var doc = this;
  counter.findByIdAndUpdate(
      { _id: "InvoiceId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    .then(function (count) {
      doc.id = count.number;
      next();
    })
    .catch(function (error) {
      console.error("counter error-> : " + error);
      throw error;
    });
});

module.exports = mongoose.model("Invoices", InvoicesSchema);
