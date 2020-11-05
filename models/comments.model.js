const mongoose = require("mongoose");

const Comments = new mongoose.Schema({
  comment: String,
  auditUserId: String,
  customerId: String,
  commentStatus: Number,
  timeStamp: String,
});

module.exports = mongoose.model("Comments", Comments);
