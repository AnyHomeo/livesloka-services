const mongoose = require("mongoose");

const SchedulerSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    required: "Teacher is Required",
    ref: "Teacher",
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
});

module.exports = mongoose.model("Schedule", SchedulerSchema);
