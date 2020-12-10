const mongoose = require("mongoose");

var StatusSchema = new mongoose.Schema(
  {
    statusId: {
      trim: true,
      type: String,
    },
    statusDesc: {
      trim: true,
      type: String,
    },
    statusName: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", StatusSchema);
