const AdminModel = require('../models/Admin.model');
const CustomerModel = require('../models/Customer.model');
const { Group, GroupMessage } = require('../models/group.model');
const { v4: uuidv4 } = require('uuid');
const findAllUsers = async () => {
  return await AdminModel.find({ roleId: { $not: { $in: [1, 3] } } }).select(
    'roleId username userId _id'
  );
};
const findInClassCustomers = async () => {
  return await CustomerModel.find({ classStatusId: '113975223750050' }).select(
    'firstName email _id'
  );
};

const createNewGroup = async ({
  agent,
  teacher,
  customer,
  groupName,
  isClass,
}) => {
  let unique = [...new Set(customer.map((el) => el.email))];
  // const agentEmails = agent.map((cust) => cust.split('|')[1]);
  // const teacherEmails = teacher.map((cust) => cust.split('|')[1]);

  // const AGENTS = await AdminModel.find({ userId: { $in: agentEmails } }).select(
  //   '_id'
  // );
  // const TEACHERS = await AdminModel.find({
  //   userId: { $in: teacherEmails },
  // }).select('_id');
  const customerIds = await AdminModel.find({
    userId: { $in: unique },
  }).select('_id');

  // const teacherIds = TEACHERS.map((el) => el._id);
  // const customerIds = CUSTOMERS.map((el) => el._id);
  // const agentIds = AGENTS.map((el) => el._id);

  const group = new Group({
    groupID: uuidv4(),
    agents: agent,
    teachers: teacher,
    customers: customer.map((el) => el.id),
    groupName,
    customerEmails: customerIds,
    messages: [],
    isClass,
  });
  return await group.save();
};

const updateGroup = async ({
  groupID,
  agent,
  teacher,
  customer,
  groupName,
  isClass,
}) => {
  let unique = [...new Set(customer.map((el) => el.email))];
  const customerIds = await AdminModel.find({
    userId: { $in: unique },
  }).select('_id');

  return await Group.findOneAndUpdate(
    { groupID },
    {
      agents: agent,
      teachers: teacher,
      customers: customer.map((el) => el.id),
      groupName,
      customerEmails: customerIds,
      isClass,
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

const findAllMessagesByGroup = async (groupID) => {
  return await Group.findOne({ groupID }).select(
    'messages groupName isClosed -_id'
  );
};

const findGroupDetails = async (groupID) => {
  return await Group.findOne({ groupID })
    .select('groupName agents teachers customers -_id')
    .populate('agents', 'username userId _id')
    .populate('customers', 'firstName email _id')
    .populate('teachers', 'username userId _id');
};
const findLastMessageByRoom = async (groupID) => {
  return await Group.findOne({ groupID })
    .select('messages -_id')
    .sort('createdAt')
    .limit(1);
};

const allGroups = async () => {
  return await Group.find()
    .select('-_id -messages')
    .populate('agents', 'username userId -_id')
    .populate('teachers', 'username userId -_id')
    .populate('customers', 'firstName email -_id')
    .populate('customerEmails', 'userId -_id')
    .sort('-updatedAt');
};
const findGroupsByCustomerEmail = async (email) => {
  const { _id } = await AdminModel.findOne({
    userId: email,
  }).select('_id');
  return await Group.find(
    { customerEmails: _id },
    {
      messages: { $slice: -1 },
      groupID: 1,
      groupName: 1,
      isClosed: 1,
      isClass: 1,
    }
  ).sort('-updatedAt');
};

const findGroupsByTeacherEmail = async (email) => {
  const { _id } = await AdminModel.findOne({
    userId: email,
  }).select('_id');
  return await Group.find(
    { teachers: _id },
    {
      messages: { $slice: -1 },
      groupID: 1,
      groupName: 1,
      isClosed: 1,
      isClass: 1,
    }
  ).sort('-updatedAt');
};

const getGroupByRole = async (roleID, userID) => {
  const { _id } = await AdminModel.findOne({
    userId: userID,
  }).select('_id');

  return await Group.find({ agents: _id })
    .select('groupID groupName -_id')
    .sort('-updatedAt');
};

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
  findGroupsByTeacherEmail,
};
