const mongoose = require("mongoose");

const TeacherLeaves = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Teacher"
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

module.exports = mongoose.model("TeacherLeaves", TeacherLeaves);
