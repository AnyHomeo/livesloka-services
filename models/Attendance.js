const mongoose = require("mongoose");

var AttendanceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    date: {
      trim: true,
      type: String,
    },
    time: {
      trim: true,
      type: String,
    },
    timeZone: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
