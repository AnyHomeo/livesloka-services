const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const Meeting = new mongoose.Schema({
  meetingAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ZoomAccount",
  },
  link: {
    type: String,
  },
});

const SchedulerSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group",
    },
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
      monday: {
        type: Array,
        default: [],
      },
      tuesday: {
        type: Array,
        default: [],
      },
      wednesday: {
        type: Array,
        default: [],
      },
      thursday: {
        type: Array,
        default: [],
      },
      friday: {
        type: Array,
        default: [],
      },
      saturday: {
        type: Array,
        default: [],
      },
      sunday: {
        type: Array,
        default: [],
      },
    },
    meetingLink: {
      trim: true,
      type: String,
    },
    meetingAccount:{
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
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
    cancelledTill:{
      type:Date
    },
    message: {
      type: String,
      default: "",
    },
    isSummerCampClass: {
      type: Boolean,
      default: false,
    },
    summerCampAmount: {
      type: Number,
      default: 0,
    },
    summerCampTitle: {
      type: String,
      trim: true,
    },
    summerCampDescription: {
      type: String,
      trim: true,
    },
    summerCampSchedule: String,
    summerCampImage: {
      type: String,
      trim: true,
    },
    summerCampStudentsLimit: {
      type: Number,
    },
    summerCampClassNumberOfDays: {
      type: Number,
    },

    meetingLinks: {
      monday: Meeting,
      tuesday: Meeting,
      wednesday: Meeting,
      thursday: Meeting,
      friday: Meeting,
      saturday: Meeting,
      sunday: Meeting,
    },
  },
  { timestamps: true }
);

SchedulerSchema.virtual("teacherData", {
  ref: "Teacher",
  localField: "teacher",
  foreignField: "id",
  justOne: true,
});

SchedulerSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Schedule", SchedulerSchema);
