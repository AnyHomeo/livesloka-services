const AdminModel = require("../models/Admin.model");
const CustomerModel = require("../models/Customer.model");
const { Group, GroupMessage } = require("../models/group.model");
const { v4: uuidv4 } = require("uuid");
const SchedulerModel = require("../models/Scheduler.model");

const createGroupFromSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await SchedulerModel.findById(scheduleId)
      .populate("students", "email firstName")
      .populate("teacherData")
      .lean();
    if (schedule) {
      let customers = schedule.students.map((customer) => customer._id);
      let customerLogins = await AdminModel.find({
        userId: { $in: schedule.students.map((customer) => customer.email) },
      });
      let teacher;
      if (schedule.teacherData.teacherMail) {
        teacher = await AdminModel.findOne({
          userId: schedule.teacherData.teacherMail,
        });
        teacher = teacher._id;
      }
      const group = new Group({
        customers,
        agents: [],
        teachers: teacher ? [teacher] : [],
        groupID: uuidv4(),
        messages: [],
        groupName: schedule.className,
        customerEmails: customerLogins.map((login) => login._id),
      });

      await group.save();
      await SchedulerModel.updateOne({ _id: scheduleId }, { group: group._id });

      let studentGroups = schedule.students.map(customer => {
        let email = customerLogins.filter((login) => login.userId === customer.email)
        console.log(email)
        return {
        customers:[customer._id],
        agents: [],
        teachers: teacher ? [teacher] : [],
        groupID: uuidv4(),
        messages: [],
        groupName: customer.firstName,
        customerEmails:email[0] && email[0]._id ? [email[0]._id] :[],      
      }})

      await Group.insertMany(studentGroups)

      return res.json({ message: "Group Created Successfully",result:group._id });
    } else {
      return res.status(500).json({ error: "Invalid Schedule Id" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const findAllUsers = async () => {
  return await AdminModel.find({ roleId: { $not: { $in: [1, 3] } } }).select(
    "roleId username userId _id"
  );
};
const findInClassCustomers = async () => {
  return await CustomerModel.find({ classStatusId: "113975223750050" }).select(
    "firstName email _id"
  );
};

const createNewGroup = async ({
  agent,
  teacher,
  customer,
  groupName,
  scheduleId,
  isClass,
}) => {
  let unique = [...new Set(customer.map((el) => el.email))];

  const customerIds = await AdminModel.find({
    userId: { $in: unique },
  }).select("_id");

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
  }).select("_id");

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
    "messages groupName isClosed -_id"
  );
};

const findGroupDetails = async (groupID) => {
  return await Group.findOne({ groupID })
    .select("groupName agents teachers customers -_id")
    .populate("agents", "username userId _id")
    .populate("customers", "firstName email _id")
    .populate("teachers", "username userId _id");
};
const findLastMessageByRoom = async (groupID) => {
  return await Group.findOne({ groupID })
    .select("messages -_id")
    .sort("createdAt")
    .limit(1);
};

const allGroups = async () => {
  return await Group.find()
    .select("-_id -messages")
    .populate("agents", "username userId -_id")
    .populate("teachers", "username userId -_id")
    .populate("customers", "firstName email -_id")
    .populate("customerEmails", "userId -_id")
    .sort("-updatedAt");
};
const findGroupsByCustomerEmail = async (email) => {
  const { _id } = await AdminModel.findOne({
    userId: email,
  }).select("_id");
  return await Group.find(
    { customerEmails: _id },
    {
      messages: { $slice: -1 },
      groupID: 1,
      groupName: 1,
      isClosed: 1,
      isClass: 1,
    }
  ).sort("-updatedAt");
};

const findGroupsByTeacherEmail = async (email) => {
  const { _id } = await AdminModel.findOne({
    userId: email,
  }).select("_id");
  return await Group.find(
    { teachers: _id },
    {
      messages: { $slice: -1 },
      groupID: 1,
      groupName: 1,
      isClosed: 1,
      isClass: 1,
    }
  ).sort("-updatedAt");
};

const getGroupByRole = async (roleID, userID) => {
  const { _id } = await AdminModel.findOne({
    userId: userID,
  }).select("_id");

  return await Group.find({ agents: _id })
    .select("groupID groupName -_id")
    .sort("-updatedAt");
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
  createGroupFromSchedule,
};
