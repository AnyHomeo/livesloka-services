const AdminModel = require('../models/Admin.model');
const AdMessagesModel = require('../models/AdMessage.model');
const SchedulerModel = require('../models/Scheduler.model');
const CustomerModel = require('../models/Customer.model');

exports.getMessagesByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const admin = await AdminModel.findOne({
			userId: email,
		})
			.select('_id')
			.lean();
		let allMessages = await AdMessagesModel.find({
			$or: [
				{
					adminIds: {
						$in: [admin._id],
					},
				},
				{ isForAll: true },
			],
		}).lean();
		return res.json({
			result: allMessages,
			messages: 'Retrieved Messages Successfully!',
		});
	} catch (error) {
		console.log(error);
		return res.json({
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
			allEmails = [...allEmails, ...schedule.students.map((student) => student.email)];
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
			allEmails = [...allEmails, ...schedule.students.map((student) => student.email)];
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
		let emails = [...new Set(allCustomersWithThatAgent.map((customer) => customer.email))];
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
