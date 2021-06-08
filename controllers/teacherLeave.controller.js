const TeacherLeavesModel = require('../models/TeacherLeaves.model');
const moment = require('moment');
const TeacherModel = require('../models/Teacher.model');

exports.getAllTeachersLeaves = async (req, res) => {
	try {
		let allLeaves = await TeacherLeavesModel.find({
			date: {
				$gte: moment().startOf('day'),
			},
		}).populate("teacherId","TeacherName").populate("scheduleId","className");
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
			}).populate("scheduleId","className").lean();
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
		let teacher = await TeacherModel.findOne({ id:teacherId }).lean();
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
			return res.json({
				message: 'Applied Leave Successfully!',
			});
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
		let teacher = await TeacherModel.findOne({ id:teacherId }).lean();
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
			console.log(updatedLeave);
			if (updatedLeave.nModified === 1) {
				return res.json({
					message: 'Leave updated Successfully!',
				});
			} else {
				return res.status(400).json({
					error: 'unable to update Leave!',
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
