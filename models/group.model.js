const mongoose = require('mongoose');
const ReplySchema = new mongoose.Schema({
  message: {
    type: String,
  },
  username: {
    type: String,
  },
  userID: {
    type: String,
  },
});
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
    reply: {
      type: ReplySchema,
      default: null,
    },
  },
  { timestamps: true }
);

var GroupSchema = new mongoose.Schema(
  {
    groupID: {
      type: String,
    },

    customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
    agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],
    teachers: [{ type: mongoose.Types.ObjectId, ref: 'Admin' }],
    customerEmails: [{ type: mongoose.Types.ObjectId, ref: 'Admin' }],

    messages: [GroupMessageSchema],
    groupName: {
      type: String,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    isClass: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports.Reply = mongoose.model('reply', ReplySchema);
module.exports.Group = mongoose.model('group', GroupSchema);
module.exports.GroupMessage = mongoose.model(
  'groupmessage',
  GroupMessageSchema
);
