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
    planId:{
      type:String,
    },
    isActive:{
        type: Boolean,
        default: true,
    },
    cancelledDate:{
      type:Date,
      default: null
    },
    id:{
        type:String,
        required: true
    },
    reason:{
      type:String,
    },
    stripeCustomer:{
      type:String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriptions", SubscriptionSchema);
