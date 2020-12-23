const mongoose = require("mongoose");

var AttendanceSchema = new mongoose.Schema(
  {
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
    date: {
      trim: true,
      type: String,
    },
    time: {
      trim: true,
      type: String,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
