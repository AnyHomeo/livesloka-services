const mongoose = require("mongoose");

var PaymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "CANCELLED"],
    },
    paymentData: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
