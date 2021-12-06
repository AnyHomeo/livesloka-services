const mongoose = require('mongoose');
const NonMessageSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

var NonRoomSchema = new mongoose.Schema(
  {
    roomID: {
      type: String,
    },
    username: {
      type: String,
    },
    agentID: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    messages: [NonMessageSchema],
    messageSeen: {
      type: Boolean,
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports.NonRoom = mongoose.model('nonroom', NonRoomSchema);
module.exports.NonMessage = mongoose.model('nonmessage', NonMessageSchema);
