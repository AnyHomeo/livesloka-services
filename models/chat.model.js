const mongoose = require("mongoose")
const MessageSchema = new mongoose.Schema(
    {
        role: {
            type: Number,
        },
        message: {
            type: String,
        },
        name: {
            type: String,
        },
    },
    {timestamps: true}
)

var RoomSchema = new mongoose.Schema(
    {
        roomID: {
            type: String,
        },
        userID: {
            type: String,
        },
        agentID: {
            type: String,
        },
        messages: [MessageSchema],
    },
    {timestamps: true}
)

module.exports.Room = mongoose.model("room", RoomSchema)
module.exports.Message = mongoose.model("message", MessageSchema)