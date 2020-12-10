const mongoose = require("mongoose");

var ClassSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    classDesc: {
      trim: true,
      type: String,
    },
    className: {
      trim: true,
      type: String,
    },
    classesStatus: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", ClassSchema);
