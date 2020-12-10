const mongoose = require("mongoose");

var AgentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    AgentDesc: {
      trim: true,
      type: String,
    },
    AgentName: {
      trim: true,
      type: String,
    },
    AgentStatus: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", AgentSchema);
