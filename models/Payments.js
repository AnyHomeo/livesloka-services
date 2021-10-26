const mongoose = require("mongoose");

var PaymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    plan:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",    
    },
    status: {
      type: String,
      enum: ["SUCCESS", "CANCELLED"],
    },
    type: {
      type: String,
      enum: ["PAYPAL", "RAZORPAY"],
      default: "PAYPAL",
    },
    amount: {
      type: Number,
    },
    paymentData: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
