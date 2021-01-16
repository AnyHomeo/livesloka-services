const Attendance = require("../models/Attendance");
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
    const allTeachers = await TeacherModel.find({}).lean();
    const allTeacherAttendances = await Attendance.find({
      date: { $regex: month },
    })
      .populate("scheduleId", "OneToOne oneToMany className students teacher")
      .lean();
    let finalDataObjectArr = [];
    allTeachers.forEach((teacher) => {
      let objToPush = {};
      objToPush.id = teacher.id;
      objToPush.name = teacher.TeacherName;
      let allAttendecesTakenByThisTeacher = allTeacherAttendances.filter(
        (singleAttendance, index) => {
          return singleAttendance.scheduleId.teacher === teacher.id;
        }
      );
      objToPush.classes = allAttendecesTakenByThisTeacher;
      objToPush.details = {};
      allAttendecesTakenByThisTeacher.forEach((attendance) => {
        let className = attendance.scheduleId.className;
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
          } else {
            objToPush.details[className].noOfDays += 1;
            objToPush.details[className].totalSalary =
              objToPush.details[className].noOfDays *
              objToPush.details[className].commission;
          }
        }
      });
      objToPush.classes = undefined;
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving Salaries",
    });
  }
};
