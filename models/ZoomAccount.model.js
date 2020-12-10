const mongoose = require("mongoose");

var ZoomAccountSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    ZoomAccountName: {
      type: String,
      trim: true,
    },
    ZoomAccountDesc: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZoomAccount", ZoomAccountSchema);
