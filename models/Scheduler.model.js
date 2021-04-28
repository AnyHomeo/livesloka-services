const mongoose = require("mongoose");

const SchedulerSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZoomAccount",
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
    scheduleDescription: {
      type: String,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    demo: {
      type: Boolean,
      default: false,
    },
    OneToOne: {
      type: Boolean,
      default: false,
    },
    oneToMany: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Upload" }],
    lastTimeJoinedClass: {
      type: Date,
    },
    isClassTemperarilyCancelled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", SchedulerSchema);
