const mongoose = require("mongoose");
var CategorySchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    categoryDesc: {
      trim: true,
      type: String,
    },
    categoryName: {
      trim: true,
      type: String,
    },
    isNotAvailableInBooking:{
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
