const mongoose = require("mongoose");
const counter = require("./AutoIncrement.model");

const InvoicesSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  company: {
    gst: {
      type: String,
    },
    pan: {
      type: String,
    },
    placeOfService: {
      type: String,
    },
    name: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    poDate: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    servicePeriod: {
      type: String,
    },
  },
  customer: {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    person: {
      type: String,
    },
    country: {
      type: String,
    },
    contact: {
      type: String,
    },
    gst: {
      type: String,
    },
    pan: {
      type: String,
    },
    state: {
      type: String,
    },
    stateCode: {
      type: String,
    },
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

  taxableValue: {
    type: Number,
  },
  transactionFee:{
    type: Number,
  },
  cgst: {
    type: Number,
  },
  sgst: {
    type: Number,
  },
  paymentMethod: {
    type:String
  },
  
  paymentDate:{
    type:Date,
  }
},{ timestamps: true});

InvoicesSchema.pre("save", function (next) {
  var doc = this;
  counter
    .findByIdAndUpdate(
      { _id: "InvoiceId" },
      { $inc: { number: 1 } },
      { new: true, upsert: true }
    )
    .then(function (count) {
      doc.id = `LS-${count.number}`;
      next();
    })
    .catch(function (error) {
      console.error("counter error-> : " + error);
      throw error;
    });
});

module.exports = mongoose.model("Invoices", InvoicesSchema);
