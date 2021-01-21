const mongoose = require("mongoose");

var UploadSchema = new mongoose.Schema(
    {
        // scheduleId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Schedule",
        // },
        className: { type: String },
        materialName: { type: String },
        UploadLink: {
            trim: true,
            type: String,
        },
        teacherId: {
            type: String,
        },
        typeOfmaterial: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Upload", UploadSchema);
