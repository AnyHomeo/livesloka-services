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
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassStatus", ClassStatusSchema);
