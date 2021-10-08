const AdminModel = require('../models/Admin.model');
const CustomerModel = require('../models/Customer.model');
const { Group, GroupMessage } = require('../models/group.model');

const findAllUsers = async () => {
  return await AdminModel.find().select('roleId username userId -_id');
};
const findInClassCustomers = async () => {
  return await CustomerModel.find({ classStatusId: '113975223750050' }).select(
    'firstName email -_id'
  );
};

const createNewGroup = async ({
  groupID,
  agent,
  teacher,
  customer,
  groupName,
}) => {
  const parentEmails = customer.map((cust) => cust.split('|')[1]);

  let unique = [...new Set(parentEmails)];
  const group = new Group({
    groupID,
    agents: agent,
    teachers: teacher,
    customers: customer,
    groupName,
    customerEmails: unique,
    messages: [],
  });
  return await group.save();
};

const updateGroup = async ({
  groupID,
  agent,
  teacher,
  customer,
  groupName,
}) => {
  const parentEmails = customer.map((cust) => cust.split('|')[1]);

  let unique = [...new Set(parentEmails)];

  return await Group.findOneAndUpdate(
    { groupID },
    {
      agents: agent,
      teachers: teacher,
      customers: customer,
      groupName,
      customerEmails: unique,
    }
  );
};
const closeGroup = async ({ groupID, isClosed }) => {
  return await Group.findOneAndUpdate({ groupID }, { isClosed });
};

const deleteGroup = async ({ groupID }) => {
  return await Group.findOneAndDelete({ groupID });
};

const addMessageToGroup = async (groupID, message, role, userID, username) => {
  // const username = await AdminModel.findOne({ userID }).select('username -_id');

  const msg = new GroupMessage({
    role,
    message,
    username,
    userID,
  });
  return await Group.findOneAndUpdate(
    { groupID },
    { $push: { messages: msg } },
    { new: true, upsert: true }
  );
};

// const addAgentToChatRoom = async (groupID, agentID) => {
//   const user = await Group.findOne({ groupID }).select('agentID -_id');
//   if (!user.agentID) {
//     console.log('adding agent to Group ' + agentID);
//     return await Group.findOneAndUpdate({ groupID }, { agentID });
//   } else {
//     return {
//       agentID,
//     };
//   }
// };

// const removeAgentFromChatRoom = async (groupID, agentID) => {
//   const user = await Group.findOne({ groupID });
//   if (user.agentID === agentID) {
//     user.agentID = undefined;
//     return user.save();
//   }
//   return false;
// };

const findAllMessagesByGroup = async (groupID) => {
  return await Group.findOne({ groupID }).select(
    'messages groupName isClosed -_id'
  );
};

const findGroupDetails = async (groupID) => {
  return await Group.findOne({ groupID }).select(
    'groupName agents teachers customers -_id'
  );
};
const findLastMessageByRoom = async (groupID) => {
  return await Group.findOne({ groupID })
    .select('messages -_id')
    .sort('createdAt')
    .limit(1);
};

// const findRoomIDByUser = async (userID) => {
//   return await Group.findOne({ userID }).select('groupID -_id');
// };

const allGroups = async () => {
  return await Group.find().select('-_id -messages').sort('-updatedAt');
};
const findGroupsByCustomerEmail = async (email) => {
  return await Group.find(
    { customerEmails: email },
    { messages: { $slice: -1 }, groupID: 1, groupName: 1, isClosed: 1 }
  ).sort('-updatedAt');
};

const getGroupByRole = async (roleID, userID) => {
  return await Group.find({ agents: userID })
    .select('groupID groupName -_id')
    .sort('-updatedAt');
};
// const findAgents = async () => {
//   return await AdminModel.find({ roleId: { $in: [4, 5] } }).select(
//     'userId -_id'
//   );
// };

// const updateAgentInChatRoom = async (groupID, agentID) => {
//   return await Group.findOneAndUpdate({ groupID }, { agentID });
// };

// const isLastMessage = async (groupID) => {
//   return await Group.findOne({ groupID }).select('messageSeen -_id');
// };

// const seeLastMessage = async (groupID) => {
//   return await Group.findOneAndUpdate({ groupID }, { messageSeen: true });
// };

// const getAgentAssignedToRoom = async (groupID) => {
//   return await Group.findOne({ groupID }).select('agentID -_id');
// };

module.exports = {
  findAllUsers,
  createNewGroup,
  addMessageToGroup,
  allGroups,
  findAllMessagesByGroup,
  getGroupByRole,
  findGroupDetails,
  updateGroup,
  closeGroup,
  deleteGroup,
  findInClassCustomers,
  findGroupsByCustomerEmail,
};
