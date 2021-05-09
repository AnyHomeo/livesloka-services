const mongoose = require("mongoose");

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
    amount: {
      type: Number,
      default:0
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Subject", SubjectSchema);
