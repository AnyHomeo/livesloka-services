const TeacherLeavesModel = require('../models/TeacherLeaves.model');
const moment = require('moment');
const TeacherModel = require('../models/Teacher.model');
const SchedulerModel = require('../models/Scheduler.model');
const AdminModel = require('../models/Admin.model');
const AdMessagesModel = require('../models/AdMessage.model');
const momentTZ = require('moment-timezone');

exports.getAllTeachersLeaves = async (req, res) => {
	try {
		let allLeaves = await TeacherLeavesModel.find({
			date: {
				$gte: moment().startOf('day'),
			},
		})
			.populate('teacherId', 'TeacherName id')
			.populate('scheduleId', 'className');
		return res.json({
			result: allLeaves,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.getTeacherLeavesByTeacherId = async (req, res) => {
	try {
		const { id } = req.params;
		let teacher = await TeacherModel.findOne({ id }).lean();
		if (teacher) {
			let leavesByTeacher = await TeacherLeavesModel.find({
				teacherId: teacher._id,
			})
				.populate('scheduleId', 'className')
				.lean();
			return res.json({
				result: leavesByTeacher,
				message: 'Leaves of Teacher Retrieved Sucessfully!',
			});
		} else {
			return res.status(400).json({
				error: 'Invalid Teacher',
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.postALeave = async (req, res) => {
	try {
		let { teacherId, scheduleId, date } = req.body;
		let teacher = await TeacherModel.findOne({ id: teacherId }).lean();
		if (teacher) {
			teacherId = teacher._id;
			req.body.teacherId = teacher._id;
			let alreadyApplied = await TeacherLeavesModel.findOne({
				teacherId,
				scheduleId: scheduleId ? scheduleId : undefined,
				date: {
					$gte: moment(date).startOf('day'),
					$lte: moment(date).endOf('day'),
				},
			});
			if (alreadyApplied) {
				return res.status(400).json({
					error: 'Already Applied on that day',
				});
			}
			req.body.scheduleId = scheduleId ? scheduleId : undefined;
			let leave = new TeacherLeavesModel({ ...req.body });
			await leave.save();
			let newAdMessage = {};
			if (scheduleId) {
				let schedule = await SchedulerModel.findById(scheduleId)
					.select('students')
					.populate('students', 'email');
				if (schedule) {
					let adminIds = await AdminModel.find({
						userId: { $in: schedule.students.map((student) => student.email) },
					}).lean();
					adminIds = adminIds.map((adminId) => adminId._id);
					newAdMessage = {
						adminIds,
						message: teacher.TeacherName + ' Teacher is on a Leave on ',
						teacherLeaveDate: date,
						icon: 'alert-circle',
						title: 'Leave Alert',
						broadCastTo: 'customers',
						expiryDate: moment(date).format(),
					};
					let notification = new AdMessagesModel(newAdMessage);
					await notification.save();
					return res.json({
						message: 'Applied Leave Successfully!',
					});
				}
			} else if (req.body.entireDay) {
				let day = momentTZ(date).tz('Asia/Kolkata').format('dddd').toLowerCase();
				let allSchedules = await Schedule.find({
					['slots.' + day + '.0']: { $exists: true },
					teacher: teacher.id,
				}).populate('students', 'email');
				let allEmails = [];
				allSchedules.forEach((schedule) => allEmails.push(schedule.students.map((student) => student.email)));
				let adminIds = await adminModel.find({ userId: { $in: allEmails} });
				adminIds = adminIds.map((admin) =>admin._id);

				newAdMessage = {
					adminIds,
					message: teacher.TeacherName + ' Teacher is on a Leave on ',
					teacherLeaveDate: date,
					icon: 'alert-circle',
					title: 'Leave Alert',
					broadCastTo: 'customers',
					expiryDate: moment(date).format(),
				};
				let notification = new AdMessagesModel(newAdMessage);
				await notification.save();
				return res.json({
					message: 'Applied Leave Successfully!',
				});

			}
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.updateALeaveByLeaveId = async (req, res) => {
	try {
		let { id } = req.params;
		let { teacherId, scheduleId, date } = req.body;
		let teacher = await TeacherModel.findOne({ id: teacherId }).lean();
		if (teacher) {
			teacherId = teacher._id;
			req.body.teacherId = teacher._id;
			let alreadyApplied = await TeacherLeavesModel.findOne({
				teacherId,
				scheduleId: scheduleId ? scheduleId : undefined,
				date: {
					$gte: moment(date).startOf('day'),
					$lte: moment(date).endOf('day'),
				},
			});
			if (alreadyApplied) {
				return res.status(400).json({
					error: 'Already Applied on that day',
				});
			}
			req.body.scheduleId = scheduleId ? scheduleId : undefined;
			let updatedLeave = await TeacherLeavesModel.updateOne({ _id: id }, { ...req.body });
			if (updatedLeave.nModified === 1) {
				return res.json({
					message: 'Leave updated Successfully!',
				});
			} else {
				return res.status(400).json({
					error: 'unable to update Leave!',
				});
			}
		} else {
			return res.status(400).json({
				error: 'Invalid User Id',
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.deleteAleaveByLeaveId = async (req, res) => {
	try {
		let { id } = req.params;
		let deletedLeave = await TeacherLeavesModel.deleteOne({ _id: id });
		console.log(deletedLeave);
		if (deletedLeave.n === 1) {
			return res.json({
				message: 'Deleted Sucessfully!',
			});
		} else {
			return res.status(400).json({
				error: 'unable to delete Leave!',
			});
		}
	} catch (error) {
		console.log(error);
		return res.json({
			error: 'Something went wrong!',
		});
	}
};
