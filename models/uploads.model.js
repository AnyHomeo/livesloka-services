const mongoose = require("mongoose");

var UploadSchema = new mongoose.Schema(
  {
    materialName: {
      type: String,
      trim: true,
    },
    UploadLink: {
      trim: true,
      type: String,
    },
    teacherId: {
      type: String,
    },
    typeOfmaterial: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Upload", UploadSchema);
