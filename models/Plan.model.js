const mongoose = require("mongoose");

var PlanSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: "Product is required!",
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    amount: {
      type: Number,
      required: "Price required for a plan",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDeleted:{
      type: Boolean,
      default:false
    },
    interval: {
      type: String,
      enum: ["day", "week", "month"],
    },
    intervalCount: {
      type: Number,
      default: 1,
    },
    stripe:{
      type:String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
