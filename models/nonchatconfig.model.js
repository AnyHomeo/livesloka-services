const mongoose = require('mongoose');

var NonRoomConfigSchema = new mongoose.Schema({
  show: {
    type: Boolean,
    default: false,
  },
  time: {
    type: Number,
    default: 5,
  },
  responseMessages: {
    type: [String],
    default: ['hi', 'hello'],
  },
});

module.exports.NonRoomConfig = mongoose.model(
  'nonroomconfig',
  NonRoomConfigSchema
);
// responseMessages: {
//     id: {
//       type: Number,
//     },
//     text: {
//       type: String,
//     },
//   },
