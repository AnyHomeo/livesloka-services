const mongoose = require("mongoose");

const InvoicesSchema = new mongoose.Schema(
  {
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
    transactionFee: {
      type: Number,
    },
    cgst: {
      type: Number,
    },
    sgst: {
      type: Number,
    },
    paymentMethod: {
      type: String,
    },

    paymentDate: {
      type: Date,
    },
    depositExchangeRate: {
      type: Number,
    },
    exchangeRate: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoices", InvoicesSchema);
