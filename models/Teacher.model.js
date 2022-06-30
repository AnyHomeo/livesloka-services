const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
var TeacherSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    teacherImageLink: {
      trim: true,
      type: String,
      default: "",
    },
    teacherVideoLink: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    rewards: {
      type: String,
      default: "",
    },
    summerCampTeacherDescription: {
      trim: true,
      type: String,
      default: "",
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
    leaveDifferenceHours: {
      type: Number,
      default: 0,
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
    firebaseLocation: {
      default: "",
      type: String,
    },
    ifsc: {
      default: "",
      type: String,
    },
    demoPriority: {
      type: Number,
      default: 1,
    },
    subject: {
      type: String,
    },
    isNotAvailableInBooking: {
      type: Boolean,
      default: false,
    },
    joinLink: {
      type: String,
    },
  },
  { timestamps: true }
);

TeacherSchema.virtual("categoryOfTeacher", {
  ref: "Category",
  localField: "category",
  foreignField: "id",
  justOne: true,
  options: {
    select: "categoryName -_id",
  },
});

TeacherSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Teacher", TeacherSchema);
