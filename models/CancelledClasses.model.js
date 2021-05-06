const mongoose = require("mongoose");

const CancelledClassesSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Customer"
    },
    cancelledDate:{
        type: Date
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CancelledClasses", CancelledClassesSchema);
