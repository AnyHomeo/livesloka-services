const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const { param } = require("../routes/teacher");

// const { parse } = require("date-fns");

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

exports.validateSlot = (req, res, next) => {
  if (!req.body.slot) {
    return res.status(400).json({ stage: 1, error: "Invalid Entry" });
  } else {
    let arr = req.body.slot.split("-");
    if (!days.includes(arr[0].trim())) {
      return res.status(400).json({ stage: 2, error: "Invalid Entry" });
    } else if (
      !(!isNaN(arr[1].split(":")[0]) && parseInt(arr[1].split(":")[0]) <= 12)
    ) {
      return res.status(400).json({ stage: 3, error: "Invalid Entry" });
    } else if (
      !(
        arr[2].split(":")[1].startsWith("30") ||
        arr[2].split(":")[1].startsWith("00")
      )
    ) {
      return res.status(400).json({ stage: 4, error: "Invalid Entry" });
    } else {
      let { slot } = req.body;
      req.body.slot =
        slot.split("-")[0].trim() +
        "-" +
        slot.split("-")[1].trim() +
        "-" +
        slot.split("-")[2].trim();
      next();
    }
  }
};

exports.addSlot = (req, res) => {
  const { id } = req.params;
  TeacherModel.findOne({
    id,
  }).then((data) => {
    if (data.availableSlots && data.scheduledSlots) {
      if (
        !data.availableSlots.includes(req.body.slot) &&
        !data.scheduledSlots.includes(req.body.slot)
      ) {
        data.availableSlots.push(req.body.slot);
      } else {
        return res.status(400).json({
          error: "Selected Slot already Added",
        });
      }
      data.save((err, docs) => {
        if (err) {
          return res.status(400).json({
            error: "internal server error",
          });
        } else {
          return res.json({
            message: "Slot added successfully",
          });
        }
      });
    } else {
      data.availableSlots = [req.body.slot];
      data.save((err, docs) => {
        if (err) {
          return res.status(400).json({
            error: "internal server error",
          });
        } else {
          return res.json({
            message: "Slot added successfully",
          });
        }
      });
    }
  });
};

exports.getAvailableSlots = (req, res) => {
  let { day } = req.query;
  const { id } = req.params;
  day = day.split(",");
  TeacherModel.findOne({ id })
    .select("availableSlots")
    .then((data) => {
      let arr = [];
      if (data.availableSlots) {
        data.availableSlots.forEach((slot) => {
          day.forEach((oneDay) => {
            if (slot.startsWith(oneDay)) {
              arr.push(slot);
            }
          });
        });
        return res.status(200).json({
          message: "slots retrieved successfully",
          result: arr,
        });
      } else {
        data.availableSlots = [];
        data.save((err, docs) => {
          if (err) {
            return res.status(500).json({
              error: "internal server error",
            });
          }
          return res.status(200).json({
            message: "Slots retrieved successfully",
            result: [],
          });
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        error: "error in retrieving data",
      });
    });
};

const salaryUpdater = (teacherobj) => {
  //console.log(teacherobj);
  let id = teacherobj.id;
  // if (teacherobj.TeacherName === 'Mythili') {
  //   console.log(teacherobj);
  // }
  Attendence.find({ teacherId: id })
    .populate('scheduleId')
    .then((data) => {
      // console.log(data);
      let salaryarray = [];
      for (classidx = 0; classidx < data.length; classidx++) {
        console.log(data[classidx].scheduleId.oneToMany);
        if (data[classidx].scheduleId.oneToMany) {
          let salary = data[classidx].customers.length * parseInt(teacherobj.Commission_Amount_Many);
          salaryarray.push(salary);
        }
        else {
          console.log("one")
          let salary = data[classidx].customers.length * parseInt(teacherobj.Commission_Amount_One);
          salaryarray.push(salary);
        }
      }
      if (salaryarray.length > 0) {
        let aggregate = salaryarray.reduce((a, b) => a + b);
        TeacherModel.update({ id: teacherobj.id },
          {
            $set: { Salary_tillNow: aggregate }
          })
          .then((data) => { })
          .catch((err) => console.log(data))
      }
    })
    .catch((err) => { console.log(err) })
};

exports.getTeachers = async (req, res) => {
  let { params } = req.query;
  if (!params) {
    return res.status(400).json({
      error: "params required",
    });
  }
  params = params.split(",").join(" ");
  TeacherModel.find({})
    .then((data) => {
      for (teacherIdx = 0; teacherIdx < data.length; teacherIdx++) {
        salaryUpdater(data[teacherIdx]);  //data[teacherIdx].Commission_Amount_One,data[teacherIdx].Commission_Amount_One
      }
    })
    .catch((err) => { console.log(err) });
  TeacherModel.find()
    .select(params)
    .then((result) => {
      let paramsNeeded = [];
      params.split(" ").forEach((para) => {
        if (!para.startsWith("-")) {
          paramsNeeded.push(para);
        }
      });
      result = result.map((item) => {
        let returnObj = {};
        paramsNeeded.forEach((key) => {
          returnObj[key] = item[key] ? item[key] : "";
        });
        return returnObj;
      });
      return res.status(200).json({
        message: "Teachers retrieved successfully",
        result,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving",
      });
    });
};

exports.deleteSlot = (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
  TeacherModel.findOne({ id })
    .select("availableSlots")
    .then((data) => {
      if (data && data.availableSlots) {
        let index = data.availableSlots.indexOf(slot);
        data.availableSlots.splice(index, 1);
        data.save((err, docs) => {
          if (err) {
            console.error(err);
            return res.status(400).json({
              error: "can't delete slot",
            });
          }
          return res.status(200).json({
            message: "deleted successfully",
            result: docs.availableSlots,
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        error: "error in retrieving teacehers data",
      });
    });
};

exports.getAllTEachers = (req, res) => {
  CustomerModel.find({ classStatusId: "113975223750050" })
    .then((students) => {
      TeacherModel.find({})
        .then((teachers) => {
          let obje = {};
          let studentslen = students.length;
          let teachersLen = teachers.length;
          for (i = 0; i < teachersLen; i++) {
            let currentTeacher = teachers[i];
            obje[currentTeacher.TeacherName] = [];
            for (j = 0; j < studentslen; j++) {
              let currentStud = students[j];
              let obj = {};
              if (currentTeacher.id === currentStud.teacherId) {
                obj.StudentId = currentStud._id;
                if (currentStud.firstName) {
                  obj.studentName = currentStud.firstName;
                } else if (currentStud.email) {
                  obj.studentName = currentStud.email;
                }
                obj.amount = currentStud.proposedAmount;
                obje[currentTeacher.TeacherName].push(obj);
              }
            }
          }
          return res.json({
            message: "Teachers Students Fetched successfully",
            result: obje,
          });
        })
        .catch((err) => {
          return res
            .status(400)
            .json({ message: "error in retrieving data ", err });
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getOccupancyDashboardData = async (req, res) => {
  try {
    let allCategories = await Category.find().select("id -_id categoryName");
    let allTeachers = await TeacherModel.find().select(
      "id TeacherName availableSlots scheduledSlots category"
    );
    let allSchedules = await Schedule.find({
      isDeleted: { $ne: true },
    }).populate("students", "firstName email");
    // .populate("meetingAccount", "ZoomAccountName");

    let finalObject = {};
    allCategories.forEach((category) => {
      finalObject[category.categoryName] = {};
      allTeachers.forEach((teacher) => {
        if (teacher.category === category.id) {
          const {
            TeacherName,
            scheduledSlots,
            availableSlots,
            _id,
            id,
          } = teacher;

          let scheduledSlotsFinal = {};
          if (scheduledSlots.length) {
            allSchedules
              .filter((schedule) => schedule.teacher === id)
              .forEach((schedule) => {
                Object.keys(schedule.slots).forEach((day) => {
                  if (
                    [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ].includes(day)
                  ) {
                    schedule.slots[day].forEach((slot) => {
                      scheduledSlotsFinal[slot] = schedule._id;
                    });
                  }
                });
              });
          }

          finalObject[category.categoryName][TeacherName] = {
            scheduledSlots: scheduledSlotsFinal,
            availableSlots,
            _id,
            id,
          };
        }
      });
    });

    return res.json({ data: finalObject, allSchedules });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving Data",
    });
  }
};

exports.getAllDaysSlots = async (req, res) => {
  const { id } = req.params;
  try {
    let availableSlotsData = await TeacherModel.findOne({ id }).select(
      "availableSlots -_id"
    );
    let scheduledSlotsData = await Schedule.find({
      teacher: id,
      isDeleted: { $ne: true },
    }).populate("students", "firstName email");
    return res.status(200).json({
      message: "data retrieved successfully",
      availableSlots: availableSlotsData.availableSlots,
      scheduledSlotsData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "error in loading data" });
  }
};

exports.GetTeacherMeetings = async (req, res) => {
  Schedule.find({ teacher: req.params.id, isDeleted: { $ne: true } })
    .populate("subject")
    .populate("students")
    .then((result) => {
      return res
        .status(200)
        .json({ message: "Fetched  meetings successfully", result });
    })
    .catch((err) => {
      return res
        .status(400)
        .json({ message: "Fetched meetings  problem", err });
    });
};

exports.GetTeacherAttendance = async (req, res) => {
  console.log(req.params);
  let id = req.params.id;
  Attendence.find({ teacherId: id })
    .populate('scheduleId')
    .then((data) => {
      console.log(data);
      if (data[0].time) {
        console.log("there")
      }
      else {
        console.log("ok")
      }
    })
    .catch((err) => { console.log(err) })

}

// exports.GetSalaries = async (req, res) => {
//   let Saldet = [];
//   TeacherModel.find({})
//     .then((TeacherData) => {
//       let eachTeacherArr = [];
//       for (let eachTeacher = 0; eachTeacher < TeacherData.length; eachTeacher++) {

//         let presentTeacher = TeacherData[eachTeacher]
//         Attendence.find({ teacherId: presentTeacher.id })
//           .populate('scheduleId')
//           .then((attedData) => {
//             // console.log("from ", attedData);

//             if (attedData.length > 0) {
//               for (attedInd = 0; attedInd < attedData.length; attedInd++) {
//                 // console.log("el", el)
//                 let el = attedData[attedInd];
//                 let eachObj = {};
//                 eachObj['TeacherName'] = presentTeacher.TeacherName;
//                 eachObj['ClassName'] = el.scheduleId.className;
//                 eachObj['No.Students'] = el.customers.length;
//                 if (el.customers.length > 1) {
//                   eachObj['Commission'] = presentTeacher.Commission_Amount_Many;
//                 }
//                 else {
//                   eachObj['Commission'] = presentTeacher.Commission_Amount_One;
//                 }
//                 let presentSchId = el.scheduleId._id;
//                 let count = [];
//                 attedData.forEach(el => {
//                   if (el.scheduleId._id = presentSchId) {
//                     count.push(el);
//                   }
//                 });
//                 eachObj['No. days'] = count.length;
//                 eachObj['salary'] = eachObj['No.Students'] * eachObj['Commission'] * eachObj['No. days'];
//                 eachTeacherArr.push(eachObj);
//               }
//             }
//             // if (eachTeacherArr.length > 0) {
//             //   console.log(eachTeacherArr);
//             //   Saldet.push(eachTeacherArr);
//             //   viewDet(Saldet)
//             // }
//             //console.log("fom ", Saldet);

//             // if (eachTeacherArr.length > 0) {
//             //   console.log(eachTeacherArr);
//             // }
//             // Saldet['1'] = eachTeacherArr;
//             // console.log(Saldet);
//             //console.log(eachTeacherArr);
//             Saldet.push(eachTeacherArr);
//             console.log("Inside", Saldet);
//           })
//           .catch((err) => { console.log(err) })
//       }
//       console.log("from ", Saldet);
//     })
//     .catch(err => { console.log(err) })
// }

exports.GetSalaries = async (req, res) => {
  try {
    const allTeachers = await TeacherModel.find({});
    let allTeacherIds = allTeachers.map((teacher) => teacher.id)
    // console.log(allTeacherIds);
    let teacherAttends = await Attendence.find({ teacherId: { $in: allTeacherIds }, }).populate('scheduleId')
    // console.log(teacherAttends);
    let finalObj = {};
    allTeachers.forEach(teacher => {
      finalObj[teacher.TeacherName] = {};
      let attendeceofTeacher = teacherAttends.filter((att) => teacher.id === att.teacherId)
      finalObj[teacher.TeacherName].allAttendece = attendeceofTeacher;
      let allclasses = finalObj[teacher.TeacherName].allAttendece.map(el => {
        return el.scheduleId.className
      })
      allclasses = [... new Set(allclasses)];
      finalObj[teacher.TeacherName].ClassName = {};
      allclasses.forEach(eachClass => {
        finalObj[teacher.TeacherName].ClassName[eachClass] = attendeceofTeacher.filter(at => at.scheduleId.className === eachClass)
      })
      finalObj[teacher.TeacherName].allAttendece = undefined;
    })
    console.log(finalObj);

    return res.status(200).json({ message: "ok", finalObj });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error });
  }
}

const viewDet = (data) => {
  console.log("from", data)
}
