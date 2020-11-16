const mongoose = require("mongoose");

var ClassStatusSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    classStatusDesc: {
      type: String,
    },
    classStatusName: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassStatu", ClassStatusSchema);
