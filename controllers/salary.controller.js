const Attendance = require('../models/Attendance');
const CustomerModel = require('../models/Customer.model');
const TeacherModel = require('../models/Teacher.model');
const SchedulerModel = require('../models/Scheduler.model');
const ExtraAmountsModel = require('../models/ExtraAmounts.model');
const FinalizedSalaries = require('../models/finalizedSalaries');
const { getSalariesOfMonth } = require('./transactions.controller');

exports.getAllDatesOfSalaries = async (req, res) => {
  try {
    const allDates = await Attendance.find().distinct('date');
    let finalArr = [];
    allDates.forEach((date) => {
      let splittedDate = date.split('-');
      if (
        splittedDate.length === 3 &&
        !finalArr.includes(`${splittedDate[0]}-${splittedDate[1]}`)
      ) {
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
    const { finalDataObjectArr, isFinalized } = await getSalariesOfMonth(
      month,
      teacher
    );
    return res.json({
      finalDataObjectArr,
      isFinalized,
    });
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
  allScheduleIdsOfThisTeacher = allScheduleIdsOfThisTeacher.map(
    (obj) => obj._id
  );
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
        objectToPush.requestedPaidStudents =
          attendance.requestedPaidStudents.map((customerObj) => {
            totalStudents += customerObj.numberOfStudents;
            return customerObj.firstName;
          });
        objectToPush.absentees = attendance.absentees.map((customerObj) => {
          totalStudents += customerObj.numberOfStudents;
          return customerObj.firstName;
        });
        finalObject[id]['totalStudents'] += totalStudents;
        finalObject[id]['totalSalary'] =
          finalObject[id]['totalStudents'] * finalObject[id]['commission'];
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
