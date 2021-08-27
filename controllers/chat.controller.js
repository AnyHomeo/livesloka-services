const AdminModel = require("../models/Admin.model") 
const {Room, Message} = require("../models/chat.model")

const createNewRoom = async (userID, roomID) => {
    const room = new Room({
        roomID,
        userID,
        messages: [],
    })
    return await room.save()
}

const addNewMessageToRoom = async (roomID, message, role, name) => {
    const msg = new Message({
        role,
        message,
        name,
    })
    return await Room.findOneAndUpdate({roomID}, {$push: {messages: msg}}, {new: true, upsert: true})
}
const addAgentToChatRoom = async (roomID, agentID) => {
    const user = await Room.findOne({roomID}).select("agentID -_id")
    if (!user.agentID) {
        console.log("adding agent to room " + agentID)
        return await Room.findOneAndUpdate({roomID}, {agentID})
    } else {
        return "agent present"
    }
}

const findAllMessagesByRoom = async (roomID) => {
    return await Room.findOne({roomID}).select("messages userID -_id")
}
const findLastMessageByRoom = async (roomID) => {
    return await Room.findOne({roomID}).select("messages -_id").sort("createdAt").limit(1)
}

const findRoomIDByUser = async (userID) => {
    return await Room.findOne({userID}).select("roomID -_id")
}

const allRooms = async () => {
    return await Room.find().select("-_id -messages").sort("-updatedAt")
}
const findAgents = async () => {
    return await AdminModel.find({roleId: 4}).select("userId -_id")
}

const updateAgentInChatRoom = async (roomID, agentID) => {
    return await Room.findOneAndUpdate({roomID}, {agentID})
}

module.exports = {
    addNewMessageToRoom,
    createNewRoom,
    findAllMessagesByRoom,
    findRoomIDByUser,
    allRooms,
    findLastMessageByRoom,
    addAgentToChatRoom,
    findAgents,
    updateAgentInChatRoom,
}