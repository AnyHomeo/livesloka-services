const mongoose = require('mongoose');
const GroupMessageSchema = new mongoose.Schema(
  {
    role: {
      type: Number,
    },
    message: {
      type: String,
    },
    username: {
      type: String,
    },
    userID: {
      type: String,
    },
  },
  { timestamps: true }
);

var GroupSchema = new mongoose.Schema(
  {
    groupID: {
      type: String,
    },
    customers: [String],
    agents: [String],
    teachers: [String],
    customerEmails: [String],
    messages: [GroupMessageSchema],
    groupName: {
      type: String,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports.Group = mongoose.model('group', GroupSchema);
module.exports.GroupMessage = mongoose.model(
  'groupmessage',
  GroupMessageSchema
);
