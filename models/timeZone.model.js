const mongoose = require("mongoose");

var TimeZoneSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    timeZoneDesc: {
      trim: true,
      type: String,
    },
    timeZoneName: {
      trim: true,
      type: String,
    },
    timeZoneStatus: {
      trim: true,
      type: String,
    },
    timeZonePriority: {
      trim: true,
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("timeZone", TimeZoneSchema);
