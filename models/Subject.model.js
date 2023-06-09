const mongoose = require('mongoose');

var SubjectSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    subjectDesc: {
      trim: true,
      type: String,
    },
    subjectName: {
      trim: true,
      type: String,
    },
    description: {
      trim: true,
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      default: 0,
    },
    imageLink: {
      type: String,
      default: '',
      trim: true,
    },
    sortingOrder: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: '',
    },
    productId: {
      type: String,
      default: '',
    },
    isNotAvailableInBooking: {
      type: Boolean,
      default: false,
    },
    rewards: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Subject', SubjectSchema);
