const AdminModel = require('../models/Admin.model');
const AdMessagesModel = require('../models/AdMessage.model');
const SchedulerModel = require('../models/Scheduler.model');
const CustomerModel = require('../models/Customer.model');

exports.getMessagesByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { isTeacher } = req.query;

    if (!(isTeacher == 1)) {
      const admin = await AdminModel.findOne({
        userId: email,
      })
        .select('_id')
        .lean();
      if (admin) {
        let allMessages = await AdMessagesModel.find({
          $or: [
            {
              adminIds: { $in: [admin._id] },
            },
            { isForAll: true },
          ],
        })
          .sort({ _id: -1 })
          .lean();

        let timeRightNow = new Date().getTime();
        let unSeenMessages = allMessages.filter(
          (message) =>
            !message.acknowledgedBy.some((id) => id.equals(admin._id)) &&
            new Date(message.expiryDate).getTime() > timeRightNow
        );
        return res.json({
          result: { allMessages, unSeenMessages },
          messages: 'Retrieved Messages Successfully!',
        });
      } else {
        return res.status(500).json({
          error: 'Something went wrong!',
        });
      }
    } else {
      let allMessages = await AdMessagesModel.find({
        broadCastedToTeachers: { $in: [email] },
      }).lean();
      let unSeenMessages = await AdMessagesModel.find({
        broadCastedToTeachers: { $in: [email] },
        acknowledgedByTeachers: { $nin: [email] },
      }).lean();
      return res.json({
        result: { allMessages, unSeenMessages },
        messages: 'Retrieved Messages Successfully!',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

const getAdminsFromScheduleIds = async (req, res) => {
  try {
    let { ids } = req.query;
    ids = ids.split(',');
    let allSelectedSchedules = await SchedulerModel.find({
      _id: {
        $in: ids,
      },
    })
      .select('students')
      .populate('students', 'email')
      .lean();
    let allEmails = [];
    allSelectedSchedules.forEach((schedule) => {
      allEmails = [
        ...allEmails,
        ...schedule.students.map((student) => student.email),
      ];
    });
    let allAdmins = await AdminModel.find({
      userId: {
        $in: allEmails,
      },
    })
      .select('customerId userId username')
      .populate('customerId', 'email firstName');
    return res.json({
      result: allAdmins,
      message: 'Admins Retrieved successfully !',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

const getAdminsFromTeacherIds = async (req, res) => {
  try {
    let { ids } = req.query;
    ids = ids.split(',');
    let allSchedules = await SchedulerModel.find({
      teacher: {
        $in: ids,
      },
    })
      .select('students')
      .populate('students', 'email')
      .lean();
    let allEmails = [];
    allSchedules.forEach((schedule) => {
      allEmails = [
        ...allEmails,
        ...schedule.students.map((student) => student.email),
      ];
    });
    let allAdmins = await AdminModel.find({
      userId: {
        $in: allEmails,
      },
    })
      .select('customerId userId username')
      .populate('customerId', 'email firstName');
    return res.json({
      result: allAdmins,
      message: 'Admins Retrieved successfully !',
    });
  } catch (error) {
    console.log(error);
  }
};

const getAdminsFromAgentId = async (req, res) => {
  try {
    let { ids } = req.query;
    ids = ids.split(',');
    let allCustomersWithThatAgent = await CustomerModel.find({
      classStatusId: '113975223750050',
      agentId: {
        $in: ids,
      },
    }).select('email');
    let emails = [
      ...new Set(allCustomersWithThatAgent.map((customer) => customer.email)),
    ];
    let allAdmins = await AdminModel.find({
      userId: {
        $in: emails,
      },
    })
      .select('customerId userId username')
      .populate('customerId', 'email firstName');
    return res.json({
      result: allAdmins,
      message: 'Admins Retrieved successfully !',
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
};

exports.getAdmins = (req, res) => {
  try {
    const { queryBy } = req.params;
    switch (queryBy) {
      case 'classes':
        return getAdminsFromScheduleIds(req, res);
      case 'teacher':
        return getAdminsFromTeacherIds(req, res);
      case 'agent':
        return getAdminsFromAgentId(req, res);
      default:
        return res.status(400).json({
          error: 'Invalid Query',
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    let allMessages = await AdMessagesModel.find({})
      .populate('users', 'username')
      .populate('schedules', 'className')
      .populate('admin', 'AgentName')
      .populate('teachers', 'TeacherName')
      .populate('agents', 'AgentName')
      .populate('broadcastedTeachers', 'TeacherName')
      .sort({ _id: -1 })
      .lean({ virtuals: true });

    return res.json({
      result: allMessages.map((message) => ({
        ...message,
        adminIds: undefined,
        scheduleIds: undefined,
      })),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

exports.addAcknowledgedCustomer = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;
    let adminId = await AdminModel.findOne({ userId }).select('');
    let notification = await AdMessagesModel.findOne({ _id: notificationId });
    if (
      !notification.acknowledgedBy
        .map((id) => id.toString())
        .includes(adminId._id)
    ) {
      notification.acknowledgedBy.push(adminId._id);
      await notification.save();
      return res.status(200).json({
        message: 'You will not see the notification again',
      });
    } else {
      return res.status(400).json({
        message: 'Already closed once',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

exports.markAllAsReadByTeacher = async (req, res) => {
  try {
    const { email } = req.body;
    await AdMessagesModel.updateMany(
      {
        broadCastedToTeachers: { $in: [email] },
        acknowledgedByTeachers: { $nin: [email] },
      },
      {
        $push: { acknowledgedByTeachers: email },
      }
    ).lean();
    return res.json({
      message: 'Marked all as read!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong',
      result: null,
    });
  }
};
