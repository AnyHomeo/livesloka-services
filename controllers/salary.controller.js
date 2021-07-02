const Attendance = require('../models/Attendance');
const CustomerModel = require('../models/Customer.model');
const TeacherModel = require('../models/Teacher.model');
const SchedulerModel = require('../models/Scheduler.model');
const ExtraAmountsModel = require('../models/ExtraAmounts.model');

exports.getAllDatesOfSalaries = async (req, res) => {
	try {
		const allDates = await Attendance.find().distinct('date');
		let finalArr = [];
		allDates.forEach((date) => {
			let splittedDate = date.split('-');
			if (splittedDate.length === 3 && !finalArr.includes(`${splittedDate[0]}-${splittedDate[1]}`)) {
				finalArr.push(`${splittedDate[0]}-${splittedDate[1]}`);
			}
		});
		return res.json({
			message: 'Salary months Retrieved Successfully!',
			result: finalArr,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Error in retrieving dates',
		});
	}
};

exports.getSalariesOfAllTeachersByMonth = async (req, res) => {
	try {
		const { month, teacher } = req.query;
		var finalDataObjectArr = [];
		let query = {};
		if (teacher) {
			query['id'] = teacher;
		}
		const allTeachers = await TeacherModel.find(query).lean();
		const allTeacherAttendances = await Attendance.find({
			date: { $regex: month },
		}).populate('scheduleId', 'OneToOne oneToMany className students teacher demo');
		Attendance.populate(
			allTeacherAttendances,
			{
				path: 'scheduleId.students',
				model: CustomerModel,
				select: 'numberOfStudents',
			},
			async (err, allTeacherAttendances) => {
				if (err) {
					console.log(err);
				}
				allTeacherAttendances = await Attendance.populate(allTeacherAttendances, {
					path: 'customers',
					model: CustomerModel,
					select: 'numberOfStudents',
				});
				allTeacherAttendances = await Attendance.populate(allTeacherAttendances, {
					path: 'absentees',
					model: CustomerModel,
					select: 'numberOfStudents',
				});
				allTeacherAttendances = await Attendance.populate(allTeacherAttendances, {
					path: 'requestedPaidStudents',
					model: CustomerModel,
					select: 'numberOfStudents',
				});
				allTeachers.forEach((teacher) => {
					let objToPush = {};
					objToPush.id = teacher.id;
					objToPush.name = teacher.TeacherName;
					let allAttendecesTakenByThisTeacher = allTeacherAttendances.filter((singleAttendance, index) => {
						if (singleAttendance.scheduleId && singleAttendance.scheduleId.isSummerCampClass) {
							return false;
						}

						if (
							singleAttendance.scheduleId &&
							singleAttendance.scheduleId.teacher === teacher.id &&
							!singleAttendance.scheduleId.demo
						) {
							return true;
						} else if (
							singleAttendance.scheduleId &&
							singleAttendance.scheduleId.teacher === teacher.id &&
							singleAttendance.scheduleId.demo &&
							teacher.isDemoIncludedInSalaries
						) {
							return true;
						} else {
							return false;
						}
					});
					objToPush.details = {};
					allAttendecesTakenByThisTeacher.forEach((attendance) => {
						if (attendance.scheduleId) {
							let className = attendance.scheduleId.className;
							if (className) {
								if (!objToPush.details[className]) {
									objToPush.details[className] = {
										scheduleId: attendance.scheduleId._id,
										noOfDays: 1,
									};
									objToPush.details[className].numberOfStudents = 0;
									let totalStudents = 0;
									attendance.customers.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									attendance.requestedPaidStudents.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									attendance.absentees.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									if (attendance.scheduleId.OneToOne) {
										objToPush.details[className].commission =
											typeof teacher.Commission_Amount_One === 'string'
												? parseInt(teacher.Commission_Amount_One)
												: 0;
										objToPush.details[className].totalSalary =
											typeof teacher.Commission_Amount_One === 'string'
												? parseInt(teacher.Commission_Amount_One)
												: 0;
									} else {
										objToPush.details[className].commission =
											typeof teacher.Commission_Amount_Many === 'string'
												? parseInt(teacher.Commission_Amount_Many)
												: 0;
										objToPush.details[className].totalSalary =
											typeof teacher.Commission_Amount_Many === 'string'
												? parseInt(teacher.Commission_Amount_Many)
												: 0;
									}
									objToPush.details[className].numberOfStudents += totalStudents;
									objToPush.details[className].totalSalary =
										objToPush.details[className].totalSalary * totalStudents;
								} else {
									let totalStudents = 0;
									attendance.customers.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									attendance.absentees.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									attendance.requestedPaidStudents.forEach((student) => {
										totalStudents += student.numberOfStudents
											? parseInt(student.numberOfStudents)
											: 1;
									});
									objToPush.details[className].numberOfStudents += totalStudents;
									objToPush.details[className].noOfDays += 1;
									objToPush.details[className].totalSalary =
										objToPush.details[className].numberOfStudents *
										objToPush.details[className].commission;
								}
							}
						}
					});
					let totalSalary = 0;
					Object.keys(objToPush.details).forEach((className) => {
						totalSalary += objToPush.details[className].totalSalary;
					});
					objToPush.totalSalary = totalSalary;
					finalDataObjectArr.push(objToPush);
				});
				//*extra amounts logic
				let splittedMonth = parseInt(month.split('-')[1]);
				let year = parseInt(month.split('-')[0]);
				let extrasOfThisMonth = await ExtraAmountsModel.find({
					month: splittedMonth,
					year,
				}).lean();
				finalDataObjectArr = finalDataObjectArr.map((teacher) => ({
					...teacher,
					extras: extrasOfThisMonth.filter((item) => item.teacherId === teacher.id),
				}));

				return res.json({
					finalDataObjectArr,
				});
			}
		);
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Error in retrieving Salaries',
		});
	}
};

exports.getSalariesOfTeacherByMonthAndId = async (req, res) => {
	const { month } = req.query;
	const { id } = req.params;
	let allScheduleIdsOfThisTeacher = await SchedulerModel.find({
		teacher: id,
	}).select('_id');
	allScheduleIdsOfThisTeacher = allScheduleIdsOfThisTeacher.map((obj) => obj._id);
	let teacherData = await TeacherModel.findOne({ id }).select(
		'Commission_Amount_One Commission_Amount_Many isDemoIncludedInSalaries'
	);
	const AttendanceByThisTeacher = await Attendance.find({
		date: { $regex: month },
		scheduleId: { $in: allScheduleIdsOfThisTeacher },
	})
		.populate('customers', 'numberOfStudents firstName')
		.populate('absentees', 'numberOfStudents firstName')
		.populate('requestedPaidStudents', 'numberOfStudents firstName')
		.populate('scheduleId', 'OneToOne demo className startDate');

	let finalObject = {};
	AttendanceByThisTeacher.forEach((attendance) => {
		if (attendance.scheduleId && attendance.scheduleId._id) {
			if (attendance.scheduleId.isSummerCampClass) {
				return;
			}
			if (!attendance.scheduleId.demo || teacherData.isDemoIncludedInSalaries) {
				if (!finalObject[attendance.scheduleId._id]) {
					let id = attendance.scheduleId._id;
					finalObject[id] = {};
					finalObject[id]['className'] = attendance.scheduleId.className;
					finalObject[id]['startDate'] = attendance.scheduleId.startDate;
					finalObject[id]['isDemo'] = attendance.scheduleId.demo;
					finalObject[id]['isOneToOneClass'] = attendance.scheduleId.OneToOne;
					finalObject[id]['commission'] = attendance.scheduleId.OneToOne
						? typeof teacherData.Commission_Amount_One === 'string'
							? parseInt(teacherData.Commission_Amount_One)
							: 0
						: typeof teacherData.Commission_Amount_Many === 'string'
						? parseInt(teacherData.Commission_Amount_Many)
						: 0;
					finalObject[id]['_id'] = id;
					finalObject[id].dates = [];
					finalObject[id]['totalStudents'] = 0;
				}
				let objectToPush = {};
				let id = attendance.scheduleId._id;
				objectToPush.date = attendance.date;
				let totalStudents = 0;
				objectToPush.presentees = attendance.customers.map((customerObj) => {
					totalStudents += customerObj.numberOfStudents;
					return customerObj.firstName;
				});
				objectToPush.requestedPaidStudents = attendance.requestedPaidStudents.map((customerObj) => {
					totalStudents += customerObj.numberOfStudents;
					return customerObj.firstName;
				});
				objectToPush.absentees = attendance.absentees.map((customerObj) => {
					totalStudents += customerObj.numberOfStudents;
					return customerObj.firstName;
				});
				finalObject[id]['totalStudents'] += totalStudents;
				finalObject[id]['totalSalary'] = finalObject[id]['totalStudents'] * finalObject[id]['commission'];
				finalObject[id].dates.push(objectToPush);
			}
		}
	});
	let result = Object.values(finalObject);
	let totalSalary =
		result.length > 1
			? result.reduce((prev, current, i) => {
					if (i === 1) {
						return prev.totalSalary + current.totalSalary;
					} else {
						return prev + current.totalSalary;
					}
			  })
			: result.length === 1
			? result.totalSalary
			: 0;
	return res.json({
		totalSalary,
		result,
	});
};
