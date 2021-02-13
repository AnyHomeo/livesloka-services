const mongoose = require("mongoose");

var UploadSchema = new mongoose.Schema(
  {
    materialName: {
      type: String,
      trim: true,
    },
    uploadLink: {
      trim: true,
      type: String,
    },
    teacherId: {
      type: String,
    },
    typeOfMaterial: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Upload", UploadSchema);
