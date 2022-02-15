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

const CountrySchema = new mongoose.Schema({
  city: String,
  country: String,
  region: String,
  ip: String,
  country_name: String,
});

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
    country: CountrySchema,
  },
  { timestamps: true }
);

module.exports.NonRoom = mongoose.model('nonroom', NonRoomSchema);
module.exports.NonMessage = mongoose.model('nonmessage', NonMessageSchema);
module.exports.UserCountry = mongoose.model('usercountry', CountrySchema);
