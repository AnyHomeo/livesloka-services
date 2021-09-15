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
      default: "PAYPAL",
    },
    isActive:{
        type: Boolean,
        default: true,
    },
    id:{
        type:String,
        required: true
    },
    subscriptionData: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriptions", SubscriptionSchema);
