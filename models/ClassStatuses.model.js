const mongoose = require("mongoose");

var ClassStatusSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    classStatusDesc: {
      trim: true,
      type: String,
    },
    classStatusName: {
      trim: true,
      type: String,
    },
    status: {
      trim: true,
      type: String,
    },
    statusCategory: {
      type: String,
      enum: ["SALES", "SUPPORT"],
    },
    statusOrder:{
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassStatu", ClassStatusSchema);
