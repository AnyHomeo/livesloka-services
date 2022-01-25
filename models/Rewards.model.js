const mongoose = require("mongoose");

var RewardsSchema = new mongoose.Schema({
    prev:{
        type: Number,
    },
    present:{
        type: Number,
    },
    teacherLeaveId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherLeaves"
    },
    message: {
        type: String,
    },
    login:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
});

module.exports = mongoose.model("Rewards", RewardsSchema);
