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
      (err, allTeacherAttendances) => {
        if (err) {
          console.log(err);
        }
        allTeachers.forEach((teacher) => {
          let objToPush = {};
          objToPush.id = teacher.id;
          objToPush.name = teacher.TeacherName;
          let allAttendecesTakenByThisTeacher = allTeacherAttendances.filter(
            (singleAttendance, index) => {
              return (
                singleAttendance.scheduleId &&
                singleAttendance.scheduleId.teacher === teacher.id &&
                !singleAttendance.scheduleId.demo
              );
            }
          );
          objToPush.details = {};
          allAttendecesTakenByThisTeacher.forEach((attendance) => {
            if (attendance.scheduleId) {
              let className = attendance.scheduleId.className;
              let totalStudents = 0;
              attendance.scheduleId.students.forEach((student) => {
                totalStudents += student.numberOfStudents
                  ? parseInt(student.numberOfStudents)
                  : 1;
              });
              if (className) {
                if (!objToPush.details[className]) {
                  objToPush.details[className] = {
                    noOfDays: 1,
                  };
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
                  objToPush.details[className].numberOfStudents = totalStudents;
                  objToPush.details[className].totalSalary =
                    objToPush.details[className].totalSalary * totalStudents;
                } else {
                  objToPush.details[className].noOfDays += 1;
                  objToPush.details[className].totalSalary =
                    objToPush.details[className].noOfDays *
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
