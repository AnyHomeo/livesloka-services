const mongoose = require("mongoose");

const Comments = new mongoose.Schema({
  comment: String,
  adminID: String,
  customerID: String,
});

module.exports = mongoose.model("Comments", Comments);
