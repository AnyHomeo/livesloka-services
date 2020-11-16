const mongoose = require("mongoose");

var ClassSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    classDesc: {
      type: String,
    },
    className: {
      type: String,
    },
    classesStatus: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", ClassSchema);
