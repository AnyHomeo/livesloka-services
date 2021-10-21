const AdminModel = require('../models/Admin.model');
const { Room, Message } = require('../models/chat.model');

const createNewRoom = async (userID, roomID) => {
  const room = new Room({
    roomID,
    userID,
    messages: [],
  });
  return await room.save();
};

const addNewMessageToRoom = async (roomID, message, role, name) => {
  const msg = new Message({
    role,
    message,
    name,
  });
  if (role === 1) {
    return await Room.findOneAndUpdate(
      { roomID },
      { $push: { messages: msg }, $set: { messageSeen: false } },
      { new: true, upsert: true }
    );
  } else {
    return await Room.findOneAndUpdate(
      { roomID },
      { $set: { messageSeen: true }, $push: { messages: msg } },
      { new: true, upsert: true }
    );
  }
};
const addAgentToChatRoom = async (roomID, agentID) => {
  const user = await Room.findOne({ roomID }).select('agentID -_id');
  if (!user.agentID) {
    console.log('adding agent to room ' + agentID);
    return await Room.findOneAndUpdate({ roomID }, { agentID });
  } else {
    return {
      agentID,
    };
  }
};

const removeAgentFromChatRoom = async (roomID, agentID) => {
  const user = await Room.findOne({ roomID });
  if (user.agentID === agentID) {
    user.agentID = undefined;
    return user.save();
  }
  return false;
};

const findAllMessagesByRoom = async (roomID) => {
  return await Room.findOne({ roomID }).select('messages userID -_id');
};
const findLastMessageByRoom = async (roomID) => {
  return await Room.findOne({ roomID })
    .select('messages -_id')
    .sort('createdAt')
    .limit(1);
};

const findRoomIDByUser = async (userID) => {
  return await Room.findOne({ userID }).select('roomID -_id');
};

const allRooms = async () => {
  return await Room.find().select('-_id -messages').sort('-updatedAt');
};

const last2DayRooms = async () => {
  return await Room.find({
    updatedAt: {
      $gte: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  })
    .select('-_id -messages')
    .sort('-updatedAt');
};

const last24hoursChat = async () => {
  return await Room.find({
    updatedAt: {
      $gte: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  }).count();
};
const unseenmessagescount = async () => {
  return await Room.find({
    messageSeen: false,
  }).count();
};

const findAgents = async () => {
  return await AdminModel.find({ roleId: { $in: [4, 5] } }).select(
    'userId -_id'
  );
};

const updateAgentInChatRoom = async (roomID, agentID) => {
  return await Room.findOneAndUpdate({ roomID }, { agentID });
};

const isLastMessage = async (roomID) => {
  return await Room.findOne({ roomID }).select('messageSeen -_id');
};

const seeLastMessage = async (roomID) => {
  return await Room.findOneAndUpdate({ roomID }, { messageSeen: true });
};

const getAgentAssignedToRoom = async (roomID) => {
  return await Room.findOne({ roomID }).select('agentID -_id');
};

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
  removeAgentFromChatRoom,
  isLastMessage,
  seeLastMessage,
  getAgentAssignedToRoom,
  last2DayRooms,
  last24hoursChat,
  unseenmessagescount,
};
