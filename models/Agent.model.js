const mongoose = require("mongoose");

var AgentSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Agent", AgentSchema);
