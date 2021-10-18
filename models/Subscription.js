const mongoose = require("mongoose");

var SubscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    type: {
      type: String,
      enum: ["PAYPAL", "STRIPE"],
      default: "STRIPE",
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    id: {
      type: String, //subscription id from third party
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cancelledDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriptions", SubscriptionSchema);
