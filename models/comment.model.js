const mongoose = require("mongoose");

var CommentSchema = new mongoose.Schema({
  comment: {
    type: String,
  },
  commentStatus: {
    type: String,
  },
  customerId: {
    type: String,
  },
  auditUserId: {
    type: String,
  },
  timeStamp: {
    type: String,
  },
});

module.exports = mongoose.model("Comment", CommentSchema);
