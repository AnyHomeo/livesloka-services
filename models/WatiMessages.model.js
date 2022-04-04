const mongoose = require("mongoose");

const WatiMessageSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    response: {
      type: String,
      default: "No response",
    },
    watiMessageId: {
      type: String,
    },
    context: {
      type: String,
      default: "FEEDBACK"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WatiMessage", WatiMessageSchema);
