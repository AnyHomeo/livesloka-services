const mongoose = require("mongoose");

const SchedulerSchema = new mongoose.Schema({
  teacher: {
    type: String,
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
    type: String,
    required: "Meeting Link Is Required",
  },
  meetingAccount: {
    type: String,
    required: "Meeting Account is Required",
  },
  demo: Boolean,
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Schedule", SchedulerSchema);
