const mongoose = require("mongoose");

const SlotOptionsSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    options: [
      {
        monday: [{ type: String }],
        tuesday: [{ type: String }],
        wednesday: [{ type: String }],
        thursday: [{ type: String }],
        friday: [{ type: String }],
        saturday: [{ type: String }],
        sunday: [{ type: String }],
      },
    ],
    schedules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SlotOptions", SlotOptionsSchema);
