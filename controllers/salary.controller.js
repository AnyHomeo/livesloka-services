const Attendance = require("../models/Attendance");
const CustomerModel = require("../models/Customer.model");
const TeacherModel = require("../models/Teacher.model");

exports.getAllDatesOfSalaries = async (req, res) => {
  try {
    const allDates = await Attendance.find().distinct("date");
    let finalArr = [];
    allDates.forEach((date) => {
      let splittedDate = date.split("-");
      if (
        splittedDate.length === 3 &&
        !finalArr.includes(`${splittedDate[0]}-${splittedDate[1]}`)
      ) {
        finalArr.push(`${splittedDate[0]}-${splittedDate[1]}`);
      }
    });
    return res.json({
      message: "Salary months Retrieved Successfully!",
      result: finalArr,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving dates",
    });
  }
};

exports.getSalariesOfAllTeachersByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    var finalDataObjectArr = [];
    const allTeachers = await TeacherModel.find({}).lean();
    const allTeacherAttendances = await Attendance.find({
      date: { $regex: month },
    }).populate(
      "scheduleId",
      "OneToOne oneToMany className students teacher demo"
    );
    Attendance.populate(
      allTeacherAttendances,
      {
        path: "scheduleId.students",
        model: CustomerModel,
        select: "numberOfStudents",
      },
      async (err, allTeacherAttendances) => {
        if (err) {
          console.log(err);
        }
        allTeacherAttendances = await Attendance.populate(
          allTeacherAttendances,
          {
            path: "customers",
            model: CustomerModel,
            select: "numberOfStudents",
          }
        );
        allTeacherAttendances = await Attendance.populate(
          allTeacherAttendances,
          {
            path: "absentees",
            model: CustomerModel,
            select: "numberOfStudents",
          }
        );
        allTeachers.forEach((teacher) => {
          let objToPush = {};
          objToPush.id = teacher.id;
          objToPush.name = teacher.TeacherName;
          let allAttendecesTakenByThisTeacher = allTeacherAttendances.filter(
            (singleAttendance, index) => {
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
            }
          );
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
                    console.log(student.numberOfStudents);
                    totalStudents += student.numberOfStudents
                      ? parseInt(student.numberOfStudents)
                      : 1;
                  });
                  attendance.absentees.forEach((student) => {
                    console.log(student.numberOfStudents);
                    totalStudents += student.numberOfStudents
                      ? parseInt(student.numberOfStudents)
                      : 1;
                  });
                  if (attendance.scheduleId.OneToOne) {
                    objToPush.details[className].commission =
                      typeof teacher.Commission_Amount_One === "string"
                        ? parseInt(teacher.Commission_Amount_One)
                        : 0;
                    objToPush.details[className].totalSalary =
                      typeof teacher.Commission_Amount_One === "string"
                        ? parseInt(teacher.Commission_Amount_One)
                        : 0;
                  } else {
                    objToPush.details[className].commission =
                      typeof teacher.Commission_Amount_Many === "string"
                        ? parseInt(teacher.Commission_Amount_Many)
                        : 0;
                    objToPush.details[className].totalSalary =
                      typeof teacher.Commission_Amount_Many === "string"
                        ? parseInt(teacher.Commission_Amount_Many)
                        : 0;
                  }
                  objToPush.details[
                    className
                  ].numberOfStudents += totalStudents;
                  objToPush.details[className].totalSalary =
                    objToPush.details[className].totalSalary * totalStudents;
                } else {
                  let totalStudents = 0;
                  attendance.customers.forEach((student) => {
                    console.log("from presentees", student.numberOfStudents);
                    totalStudents += student.numberOfStudents
                      ? parseInt(student.numberOfStudents)
                      : 1;
                  });
                  attendance.absentees.forEach((student) => {
                    console.log("from absentees", student.numberOfStudents);
                    totalStudents += student.numberOfStudents
                      ? parseInt(student.numberOfStudents)
                      : 1;
                  });
                  objToPush.details[
                    className
                  ].numberOfStudents += totalStudents;
                  console.log(objToPush.details[className].numberOfStudents);
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
        return res.json({
          finalDataObjectArr,
        });
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving Salaries",
    });
  }
};
