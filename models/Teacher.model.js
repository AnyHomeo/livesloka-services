const mongoose = require("mongoose");

var TeacherSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    TeacherDesc: {
      trim: true,
      type: String,
    },
    TeacherName: {
      trim: true,
      type: String,
    },
    TeacherStatus: {
      trim: true,
      type: String,
    },
    TeacherSubjectsId: {
      type: Array,
      default: [],
    },
    availableSlots: {
      type: Array,
      default: [],
    },
    scheduledSlots: {
      type: Array,
      default: [],
    },
    category: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
