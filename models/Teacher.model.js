const mongoose = require("mongoose");

var TeacherSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    TeacherDesc: {
      type: String,
    },
    TeacherName: {
      type: String,
    },
    TeacherStatus: {
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
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
