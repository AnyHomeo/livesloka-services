const mongoose = require("mongoose");

const Comments = new mongoose.Schema({
  comment: {
    type: String,
    trim: true,
  },
  auditUserId: {
    type: String,
    trim: true,
  },
  customerId: {
    type: String,
    trim: true,
  },
  commentStatus: {
    type: Number,
    trim: true,
  },
  timeStamp: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Comments", Comments);
