const mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    teacherId: {
      type: String,
    },
    scheduleId: {
      type: String,
    },
    ratingValue: {
      type: String,
    },
    ratingDesc: {
      type: String,
    },
    className: {
      type: String,
    },
    studentName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reviews', ReviewSchema);
