const mongoose = require("mongoose");

const SchedulerSchema = new mongoose.Schema({
  teacher: {
    type: String,
    trim: true,
    required: "Teacher is Required",
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  ],
  slots: {
    monday: Array,
    tuesday: Array,
    wednesday: Array,
    thursday: Array,
    friday: Array,
    saturday: Array,
    sunday: Array,
  },
  meetingLink: {
    trim: true,
    type: String,
    required: "Meeting Link Is Required",
  },
  meetingAccount: {
    trim: true,
    type: String,
    required: "Meeting Account is Required",
  },
  startDate: {
    trim: true,
    type: String,
    required: "Start Date is Required",
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: "Subject is Required",
  },
  className: {
    type: String,
    trim: true,
  },
  demo: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Schedule", SchedulerSchema);
