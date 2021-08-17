const mongoose = require("mongoose");

const SlotOptionsSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    slots: [
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Teacher",
        },
        slots: [
          {
            type: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SlotOptions", SlotOptionsSchema);
