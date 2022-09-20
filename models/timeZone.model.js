const mongoose = require('mongoose');

var TimeZoneSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    timeZoneDesc: {
      trim: true,
      type: String,
    },
    timeZoneName: {
      trim: true,
      type: String,
    },
    timeZoneStatus: {
      trim: true,
      type: String,
    },
    timeZonePriority: {
      trim: true,
      type: Boolean,
      default: true,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Currency',
      default: '5f98fabdd5e2630017ec9ac1',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('timeZone', TimeZoneSchema);
