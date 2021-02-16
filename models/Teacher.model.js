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
    teacherMail: {
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
    Commission_Amount_One: {
      type: String,
      default: "0",
    },
    Commission_Amount_Many: {
      type: String,
      default: "0",
    },
    Salary_tillNow: {
      type: String,
      default: "0",
    },
    Bank_account: {
      type: String,
    },
    Phone_number: {
      type: String,
    },
    Bank_full_name: {
      type: String,
    },
    isDemoIncludedInSalaries: {
      type: Boolean,
      default: false,
    },
    lastTimeJoinedClass: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
