const AdminModel = require('../models/Admin.model');
const { NonRoom, NonMessage, UserCountry } = require('../models/nonchat.model');

const createNewNonRoom = async (username, roomID, country) => {
  const nonroom = new NonRoom({
    roomID,
    username,
    messages: [],
    country: new UserCountry(country),
  });
  return await nonroom.save();
};

const addNewMessageToNonRoom = async (roomID, message, role, username) => {
  const msg = new NonMessage({
    role,
    message,
    username,
  });
  if (role === 0) {
    return await NonRoom.findOneAndUpdate(
      { roomID },
      { $push: { messages: msg }, $set: { messageSeen: false } },
      { new: true, upsert: true }
    );
  } else {
    return await NonRoom.findOneAndUpdate(
      { roomID },
      { $set: { messageSeen: true }, $push: { messages: msg } },
      { new: true, upsert: true }
    );
  }
};
const assignAgentToNonChat = async (roomID, agentID, roleID) => {
  console.log(agentID, roleID);

  const user = await NonRoom.findOne({ roomID })
    .select('agentID -_id')
    .populate('agentID', 'username');
  if (!user.agentID) {
    if (roleID === 3) {
      console.log('adding admin to room ' + agentID);

      return await NonRoom.findOneAndUpdate(
        { roomID },
        { admin: true, agentID }
      );
    } else {
      console.log('adding agent to room ' + agentID);

      return await NonRoom.findOneAndUpdate({ roomID }, { agentID });
    }
  } else {
    return {
      present: true,
      user,
    };
  }
};

const assignToAdmin = async (roomID) => {
  return await NonRoom.findOneAndUpdate({ roomID }, { admin: true });
};

const unseenmessagescountnn = async () => {
  return await NonRoom.find({
    messageSeen: false,
  }).count();
};

// const removeAgentFromChatRoom = async (roomID, agentID) => {
//   const user = await Room.findOne({ roomID });
//   if (user.agentID === agentID) {
//     user.agentID = undefined;
//     return user.save();
//   }
//   return false;
// };

const findAllMessagesByNonRoom = async (roomID) => {
  return await NonRoom.findOne({ roomID }).select(
    'messages username admin country -_id'
  );
};

// const findLastMessageByRoom = async (roomID) => {
//   return await Room.findOne({ roomID })
//     .select('messages -_id')
//     .sort('createdAt')
//     .limit(1);
// };

// const findRoomIDByUser = async (userID) => {
//   return await Room.findOne({ userID }).select('roomID -_id');
// };

const allNonRooms = async () => {
  // const last = day !== undefined ? day : 3;
  return await NonRoom.find(
    {
      updatedAt: {
        $gte: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    },
    {
      messages: { $slice: -1 },
    }
  )
    .populate('agentID', 'username _id')
    .sort('-updatedAt');
  //  Group.find(
  //    { customerEmails: _id },
  //    {
  //      messages: { $slice: -1 },
  //      groupID: 1,
  //      groupName: 1,
  //      isClosed: 1,
  //      isClass: 1,
  //    }
  //  ).sort('-updatedAt');
};

const nonAssignedChats = async () => {
  return await NonRoom.find(
    {
      agentID: null,
      admin: false,
    },
    {
      messages: { $slice: -1 },
    }
  ).sort('-updatedAt');
  //  Group.find(
  //    { customerEmails: _id },
  //    {
  //      messages: { $slice: -1 },
  //      groupID: 1,
  //      groupName: 1,
  //      isClosed: 1,
  //      isClass: 1,
  //    }
  //  ).sort('-updatedAt');
};
const deleteNonChat = async (roomID) => {
  return await NonRoom.findOneAndDelete({ roomID });
};

// const last2DayRooms = async () => {
//   return await Room.find({
//     updatedAt: {
//       $gte: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
//     },
//   })
//     .select('-_id -messages')
//     .sort('-updatedAt');
// };

// const last24hoursChat = async () => {
//   return await Room.find({
//     updatedAt: {
//       $gte: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
//     },
//   }).count();
// };
// const unseenmessagescount = async () => {
//   return await Room.find({
//     messageSeen: false,
//   }).count();
// };

// const findAgents = async () => {
//   return await AdminModel.find({ roleId: { $in: [4, 5] } }).select(
//     'userId -_id'
//   );
// };

// const updateAgentInChatRoom = async (roomID, agentID) => {
//   return await Room.findOneAndUpdate({ roomID }, { agentID });
// };

// const isLastMessage = async (roomID) => {
//   return await Room.findOne({ roomID }).select('messageSeen -_id');
// };

// const seeLastMessage = async (roomID) => {
//   return await Room.findOneAndUpdate({ roomID }, { messageSeen: true });
// };

// const getAgentAssignedToRoom = async (roomID) => {
//   return await Room.findOne({ roomID }).select('agentID -_id');
// };

module.exports = {
  addNewMessageToNonRoom,
  createNewNonRoom,
  findAllMessagesByNonRoom,
  allNonRooms,
  nonAssignedChats,
  assignToAdmin,
  assignAgentToNonChat,
  deleteNonChat,
  unseenmessagescountnn,
};
