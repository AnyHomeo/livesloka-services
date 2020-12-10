const mongoose = require("mongoose");

var CommentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      trim: true,
    },
    commentStatus: {
      trim: true,
      type: String,
    },
    customerId: {
      trim: true,
      type: String,
    },
    auditUserId: {
      trim: true,
      type: String,
    },
    timeStamp: {
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
