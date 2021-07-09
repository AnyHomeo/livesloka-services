const FinalizedSalaries = require("../models/finalizedSalaries");
const Attendance = require("../models/Attendance");
const CustomerModel = require("../models/Customer.model");
const TeacherModel = require("../models/Teacher.model");
const SchedulerModel = require("../models/Scheduler.model");
const ExtraAmountsModel = require("../models/ExtraAmounts.model");

exports.finalizeSalaries = async (req, res) => {
  try {
    const { month, year, otps } = req.body;
    const query = {
      month: parseInt(month),
      year: parseInt(year),
    };
    const finalizeSalariesDocument = await FinalizedSalaries.findOne(query);
    if (finalizeSalariesDocument) {
      let { otpsToValidate } = finalizeSalariesDocument;
      let otpsToValidateObject = {};
      otpsToValidate.forEach((otp) => {
        otpsToValidateObject[otp.agentId] = otp.otp;
      });
      let isAllOtpsValid = otps.every((otp) => {
        return otpsToValidateObject[otp.agentId] == otp.otp;
      });
      if (isAllOtpsValid) {
        let regex = `${year}-${month}`;
        var finalDataObjectArr = [];
        const allTeachers = await TeacherModel.find().lean();
        const allTeacherAttendances = await Attendance.find({
          date: { $regex: regex },
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
                select: "numberOfStudents -_id firstName",
              }
            );
            allTeacherAttendances = await Attendance.populate(
              allTeacherAttendances,
              {
                path: "absentees",
                model: CustomerModel,
                select: "numberOfStudents -_id firstName",
              }
            );
            allTeacherAttendances = await Attendance.populate(
              allTeacherAttendances,
              {
                path: "requestedPaidStudents",
                model: CustomerModel,
                select: "numberOfStudents -_id  firstName",
              }
            );
            allTeachers.forEach((teacher) => {
              let objToPush = {};
              objToPush.id = teacher.id;
              objToPush.name = teacher.TeacherName;
              let allAttendecesTakenByThisTeacher =
                allTeacherAttendances.filter((singleAttendance, index) => {
                  if (
                    singleAttendance.scheduleId &&
                    singleAttendance.scheduleId.isSummerCampClass
                  ) {
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
                        dates: [attendance.date],
                        presentees: [
                          attendance.customers.map(
                            (customer) => (customer && customer.firstName) || "deleted user"
                          ),
                        ],

                        absentees: [
                          attendance.absentees.map(
                            (customer) => (customer && customer.firstName) || "deleted user"
                          ),
                        ],
                        requestedPaidStudents: [
                          attendance.requestedPaidStudents.map(
                            (customer) => (customer && customer.firstName) || "deleted user"
                          ),
                        ],
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
                      objToPush.details[className].numberOfStudents +=
                        totalStudents;
                      objToPush.details[className].totalSalary =
                        objToPush.details[className].totalSalary *
                        totalStudents;
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
                      objToPush.details[className].dates.push(attendance.date),
                        objToPush.details[className].presentees.push(
                          attendance.customers.map(
                            (customer) => (customer && customer.firstName) || "deleted user"
                          )
                        );
                      objToPush.details[className].absentees.push(
                        attendance.absentees.map(
                          (customer) => (customer && customer.firstName) || "deleted user"
                        )
                      );
                      objToPush.details[className].requestedPaidStudents.push(
                        attendance.requestedPaidStudents.map(
                          (customer) => (customer && customer.firstName) || "deleted user"
                        )
                      );
                      objToPush.details[className].numberOfStudents +=
                        totalStudents;
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
            let extrasOfThisMonth = await ExtraAmountsModel.find({
              month,
              year,
            }).lean();
            finalDataObjectArr = finalDataObjectArr.map((teacher) => ({
              ...teacher,
              extras: extrasOfThisMonth.filter(
                (item) => item.teacherId === teacher.id
              ),
            }));
            finalizeSalariesDocument.finalizedSalaries = finalDataObjectArr;
            finalizeSalariesDocument.markModified("finalizedSalaries");
            await finalizeSalariesDocument.save();
            return res.json({
              message: "Finalized salaries successfully!",
              isFinalized: true,
              result: finalDataObjectArr,
            });
          }
        );
      } else {
        return res.status(400).json({
          error: "Invalid OTPs, please try again!",
        });
      }
    } else {
      return res.status(400).json({
        error: "Invalid OTPs, please try again!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something wwent wrong!",
    });
  }
};
