const SchedulerModel = require('../models/Scheduler.model');
const CustomerModel = require('../models/Customer.model');
const AdminModel = require('../models/Admin.model');
const SubjectModel = require('../models/Subject.model');
const TeacherModel = require('../models/Teacher.model');

exports.submitForm = async (req, res) => {
	try {
		let alreadyExists = await AdminModel.countDocuments({ userId: req.body.email });
		let newCustomer = new CustomerModel(req.body);
		await newCustomer.save();
		if (alreadyExists) {
			let newAdmin = new Admin({
				username: req.body.firstName,
				userId: req.body.email,
				roleId: 1,
				customerId: newCustomer._id,
			});
			await newAdmin.save();
		}
		let schedule = await SchedulerModel.findById(scheduleId);
		schedule.students.push(newCustomer._id);
		await schedule.save();
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.getSummerCampSchedules = async (req, res) => {
	try {
		let summerCampSchedules = await SchedulerModel.find({
			isSummerCampClass: true,
		});
		return res.json({
			result: summerCampSchedules,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.getSummerCampDataWithSchedules = async (req, res) => {
	try {
		const { id } = req.params;
		let subject = await SubjectModel.findById(id).select('subjectName summerCampTitle summerCampDescription');
		let schedules = await SchedulerModel.find({
			isSummerCampClass: true,
			subject: id,
		}).select('teacher students slots summerCampAmount');
		let teachers = schedules.map((schedule) => schedule.teacher);
		let allTeachersData = await TeacherModel.find({
			id: {
				$in: teachers,
			},
		}).select('summerCampTeacherDescription teacherImageLink TeacherName id');
		let studentsCount =
			schedules.length === 0
				? 0
				: schedules.length === 1
				? schedules[0].students.length
				: schedules.reduce((prev, current, i) => {
						if (i === 1) {
							return prev.students
								? prev.students.length
								: 0 + current.students
								? current.students.length
								: 0;
						} else {
							return prev + current.students.length;
						}
				  });
		return res.json({
			subject,
			schedules,
			allTeachersData,
			studentsCount,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong !!',
		});
	}
};
