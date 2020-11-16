const mongoose = require("mongoose");

var AgentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    AgentDesc: {
      type: String,
    },
    AgentName: {
      type: String,
    },
    AgentStatus: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", AgentSchema);
