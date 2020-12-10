const mongoose = require("mongoose");

var SubjectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    subjectDesc: {
      type: String,
    },
    subjectName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);
