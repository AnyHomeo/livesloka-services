const mongoose = require("mongoose");

var AttendanceSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
