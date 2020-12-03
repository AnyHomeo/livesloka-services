const mongoose = require("mongoose");
var CategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    categoryDesc: {
      type: String,
    },
    categoryName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
