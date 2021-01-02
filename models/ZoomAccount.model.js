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
    zoomJwt: {
      type: String,
      trim: true,
    },
    zoomApi: {
      type: String,
      trim: true,
    },
    zoomSecret: {
      type: String,
      trim: true,
    },
    zoomPassword: {
      type: String,
      trim: true,
    },
    zoomEmail: {
      type: String,
      trim: true,
    },
    timeSlots: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZoomAccount", ZoomAccountSchema);
