const mongoose = require("mongoose");

var UploadSchema = new mongoose.Schema(
    {
        scheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Schedule",
        },
        className: { type: String },
        youtubeLink: {
            trim: true,
            type: String,
        },
        UploadLink: {
            trim: true,
            type: String,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
        },
        typeOfmaterial: {
            type: String,
        }
    }
);

module.exports = mongoose.model("Upload", UploadSchema);
