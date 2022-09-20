const Transactions = require('../models/Transactions');
const momentTZ = require('moment-timezone');
const Attendance = require('../models/Attendance');
const TeacherModel = require('../models/Teacher.model');
const ExtraAmountsModel = require('../models/ExtraAmounts.model');
const FinalizedSalaries = require('../models/finalizedSalaries');
const ExpensesModel = require('../models/expenses.model');

let mapFirstNames = (arr) =>
  arr
    ? arr.map((customer) => (customer && customer.firstName) || 'deleted user')
    : [];

let getCommission = (schedule, teacher) =>
  schedule.OneToOne
    ? parseInt(teacher.Commission_Amount_One) || 0
    : parseInt(teacher.Commission_Amount_Many) || 0;

const getSalariesOfMonth = async (month, teacher) => {
  try {
    let numericMonth = parseInt(month.split('-')[1]);
    let numericYear = parseInt(month.split('-')[0]);
    const finalizeSalariesDocument = await FinalizedSalaries.findOne({
      month: numericMonth,
      year: numericYear,
    }).lean();
    if (finalizeSalariesDocument && finalizeSalariesDocument.finalizeSalaries) {
      if (teacher) {
        return {
          finalDataObjectArr: finalizeSalariesDocument.finalizeSalaries.filter(
            (item) => item.id === teacher
          ),
          isFinalized: true,
        };
      } else {
        return {
          finalDataObjectArr: finalizeSalariesDocument.finalizeSalaries,
          isFinalized: true,
        };
      }
    } else {
      var finalDataObjectArr = [];
      let query = {};
      let attendanceQuery = {
        date: { $regex: month },
      };
      if (teacher) {
        query['id'] = teacher;
        attendanceQuery['teacherId'] = teacher;
      }

      const allTeachers = await TeacherModel.find(query).lean();
      const allTeacherAttendances = await Attendance.find({
        date: { $regex: month },
      })
        .populate(
          'scheduleId',
          'OneToOne oneToMany className students teacher demo'
        )
        .populate('customers', 'numberOfStudents firstName')
        .populate('absentees', 'numberOfStudents firstName')
        .populate('requestedPaidStudents', 'numberOfStudents firstName')
        .lean();

      allTeachers.forEach((teacher) => {
        let objToPush = {};
        objToPush.id = teacher.id;
        objToPush.name = teacher.TeacherName;
        let allAttendecesTakenByThisTeacher = allTeacherAttendances.filter(
          (singleAttendance) => {
            let { scheduleId } = singleAttendance;
            return (
              scheduleId &&
              !scheduleId.isSummerCampClass &&
              scheduleId.teacher === teacher.id &&
              ((scheduleId.demo && teacher.isDemoIncludedInSalaries) ||
                !scheduleId.demo)
            );
          }
        );
        objToPush.details = {};
        allAttendecesTakenByThisTeacher.forEach((attendance) => {
          let className =
            attendance &&
            attendance.scheduleId &&
            attendance.scheduleId.className;
          if (className) {
            let { customers, absentees, requestedPaidStudents } = attendance;
            let totalStudents;
            if (requestedPaidStudents) {
              totalStudents = [
                ...customers,
                ...absentees,
                ...requestedPaidStudents,
              ];
            } else {
              totalStudents = [...customers, ...absentees];
            }
            totalStudents = totalStudents.reduce((acc, student) => {
              acc += student.numberOfStudents
                ? parseInt(student.numberOfStudents)
                : 1;
              return acc;
            }, 0);
            if (!objToPush.details[className]) {
              objToPush.details[className] = {
                scheduleId: attendance.scheduleId._id,
                noOfDays: 1,
                dates: [attendance.date],
                presentees: [mapFirstNames(customers)],
                absentees: [mapFirstNames(absentees)],
                requestedPaidStudents: [mapFirstNames(requestedPaidStudents)],
                numberOfStudents: totalStudents,
                commission: getCommission(attendance.scheduleId, teacher),
                totalSalary:
                  totalStudents * getCommission(attendance.scheduleId, teacher),
              };
            } else {
              objToPush.details[className].numberOfStudents += totalStudents;
              objToPush.details[className].noOfDays += 1;
              objToPush.details[className].totalSalary =
                objToPush.details[className].numberOfStudents *
                objToPush.details[className].commission;
              objToPush.details[className].dates.push(attendance.date);
              objToPush.details[className].presentees.push(
                mapFirstNames(customers)
              );
              objToPush.details[className].absentees.push(
                mapFirstNames(absentees)
              );
              objToPush.details[className].requestedPaidStudents.push(
                mapFirstNames(requestedPaidStudents)
              );
            }
          }
        });
        objToPush.totalSalary = Object.keys(objToPush.details).reduce(
          (totalSalary, className) =>
            (totalSalary += objToPush.details[className].totalSalary),
          0
        );
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
        extras: extrasOfThisMonth.filter(
          (item) => item.teacherId === teacher.id
        ),
      }));
      return {
        finalDataObjectArr,
        isFinalized: false,
      };
    }
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

function getDaysInMonth(month, year) {
  var date = new Date(year, month, 1);
  var days = [];
  while (date.getMonth() === month) {
    days.push(momentTZ(date).format('YYYY-MM-DD'));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

exports.getTransactionsData = async (req, res) => {
  try {
    const { month } = req.query;
    //2021-02 format month
    let months = month
      .split(',')
      .filter((val, i, self) => self.indexOf(val) === i);
    let output = {};
    await asyncForEach(months, async (month) => {
      let splittedMonth = parseInt(month.split('-')[1]);
      let splittedYear = parseInt(month.split('-')[0]);
      let startOfMonth = momentTZ(month, 'YYYY-MM')
        .tz('Asia/Kolkata')
        .startOf('month')
        .format();
      let endOfMonth = momentTZ(month, 'YYYY-MM')
        .tz('Asia/Kolkata')
        .endOf('month')
        .format();
      let allTransactionsOftheMonth = await Transactions.find({
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      }).sort({ date: 1 });
      let allDates = getDaysInMonth(splittedMonth - 1, splittedYear);
      allTransactionsOftheMonth = allTransactionsOftheMonth.reduce(
        (prev, next) => {
          let key = momentTZ(next['date']).format('YYYY-MM-DD');
          if (!prev[key]) {
            prev[key] = [];
          }
          prev[key].push(next);
          return prev;
        },
        {}
      );
      let dateWiseAmount = allDates.map((date) =>
        allTransactionsOftheMonth[date]
          ? allTransactionsOftheMonth[date]
              .map((transaction) => transaction.amount)
              .reduce((a, b) => a + b, 0)
          : 0
      );

      let extraArr = [...new Array(31 - dateWiseAmount.length)].map((_) => 0);
      output[month] = dateWiseAmount.concat(extraArr);
    });
    return res.json({
      result: output,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

exports.getCardsData = async (req, res) => {
  try {
    const { month } = req.query;
    let startOfMonth = momentTZ(month, 'YYYY-MM')
      .tz('Asia/Kolkata')
      .startOf('month')
      .format();
    let endOfMonth = momentTZ(month, 'YYYY-MM')
      .tz('Asia/Kolkata')
      .endOf('month')
      .format();
    let allTransactionsOftheMonth = await Transactions.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });
    let { finalDataObjectArr } = await getSalariesOfMonth(month);
    let netAmount = parseFloat(
      allTransactionsOftheMonth
        .reduce((acc, next) => acc + next.amount || 0, 0)
        .toFixed(2)
    );
    let salaries = finalDataObjectArr.reduce((totalSalary, teacher) => {
      let teacherExtrasSalary = teacher.extras.reduce((total, extra) => {
        total += extra.amount;
        return total;
      }, 0);
      let teacherSalary = Object.keys(teacher.details).reduce(
        (total, className) => {
          total += teacher.details[className].totalSalary;
          return total;
        },
        0
      );
      return totalSalary + teacherExtrasSalary + teacherSalary;
    }, 0);

    let expenses = await ExpensesModel.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).select('amount');
    expenses = expenses.reduce((acc, expense) => (acc += expense.amount), 0);
    res.json({
      netAmount,
      salaries,
      expenses,
      profit: netAmount - salaries - expenses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};

exports.getSalariesOfMonth = getSalariesOfMonth;

exports.getTransactionsTable = async (req, res) => {
  try {
    const { month } = req.query;
    let startOfMonth = momentTZ(month, 'YYYY-MM')
      .tz('Asia/Kolkata')
      .startOf('month')
      .format();
    let endOfMonth = momentTZ(month, 'YYYY-MM')
      .tz('Asia/Kolkata')
      .endOf('month')
      .format();
    let allTransactionsOftheMonth = await Transactions.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .sort({ date: 1 })
      .lean();
    return res.json({
      result: allTransactionsOftheMonth,
      message: 'Transactions Retrieved Successfully!',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};
