const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const { param } = require("../routes/teacher");
const SchedulerModel = require("../models/Scheduler.model");
const CancelledClassesModel = require("../models/CancelledClasses.model");

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
  let id = teacherobj.id;
  Attendence.find({ teacherId: id })
    .populate("scheduleId")
    .then((data) => {
      let salaryarray = [];
      for (classidx = 0; classidx < data.length; classidx++) {
        if (data[classidx].scheduleId.oneToMany) {
          let salary =
            data[classidx].customers.length *
            parseInt(teacherobj.Commission_Amount_Many);
          salaryarray.push(salary);
        } else {
          let salary =
            data[classidx].customers.length *
            parseInt(teacherobj.Commission_Amount_One);
          salaryarray.push(salary);
        }
      }
      if (salaryarray.length > 0) {
        let aggregate = salaryarray.reduce((a, b) => a + b);
        TeacherModel.update(
          { id: teacherobj.id },
          {
            $set: { Salary_tillNow: aggregate },
          }
        )
          .then((data) => {})
          .catch((err) => console.log(data));
      }
    })
    .catch((err) => {
      console.log(err);
    });
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
        salaryUpdater(data[teacherIdx]); //data[teacherIdx].Commission_Amount_One,data[teacherIdx].Commission_Amount_One
      }
    })
    .catch((err) => {
      console.log(err);
    });
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
    .lean()
    .then(async (result) => {
      result = await Promise.all(result.map(async (eachSchedule) => {
        let cancelledClasses = await CancelledClassesModel.find({scheduleId:eachSchedule._id}).populate("studentId","firstName")
        return {...eachSchedule,cancelledClasses}
      }))
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
  let id = req.params.id;
  Attendence.find({ teacherId: id })
    .populate("scheduleId")
    .then((data) => {})
    .catch((err) => {
      console.log(err);
    });
};

exports.GetSalaries = async (req, res) => {
  try {
    // let dat = req.params.month;
    const allTeachers = await TeacherModel.find({});
    let allTeacherIds = allTeachers.map((teacher) => teacher.id);
    let dat = "2021-01";
    let teacherAttends = await Attendence.find({
      $and: [
        { teacherId: { $in: allTeacherIds } },
        { date: { $regex: dat, $options: "m" } },
      ],
    }).populate("scheduleId");
    let finalObj = [];
    allTeachers.forEach((teacher) => {
      let objj = {
        details: [],
      };
      objj["TeacherName"] = teacher.TeacherName;
      let attendeceofTeacher = teacherAttends.filter(
        (att) => teacher.id === att.teacherId
      );
      attendeceofTeacher.forEach((eachAtt) => {
        let obj = {};
        obj["ClassName"] = eachAtt.scheduleId.className;
        obj["No.Students"] = eachAtt.customers.length;
        obj["Number of Days"] = attendeceofTeacher.length;
        if (eachAtt.scheduleId.OneToOne) {
          obj["commission"] = teacher.Commission_Amount_One;
        } else {
          obj["commission"] = teacher.Commission_Amount_Many;
        }
        obj["salary"] =
          obj["No.Students"] * obj["Number of Days"] * obj["commission"];
        objj["details"].push(obj);
      });
      objj["salary"] = 0;
      objj["details"].forEach((ell) => {
        objj["salary"] = objj["salary"] + parseInt(ell.salary);
      });
      finalObj.push(objj);
      // finalObj[teacher.TeacherName].allAttendece = attendeceofTeacher;
      // let allclasses = finalObj[teacher.TeacherName].allAttendece.map(el => {
      //   return el.scheduleId.className
      // })
      // allclasses = [... new Set(allclasses)];
      // finalObj[teacher.TeacherName].ClassName = {};
      // allclasses.forEach(eachClass => {
      //   finalObj[teacher.TeacherName].ClassName[eachClass] = attendeceofTeacher.filter(at => at.scheduleId.className === eachClass)
      //  let eachClassDetails = attendeceofTeacher.filter(at => at.scheduleId.className === eachClass)

      // })
      // finalObj[teacher.TeacherName].allAttendece = undefined;
    });

    return res.status(200).json({ message: "ok", finalObj });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

exports.joinClass = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    let schedule = await SchedulerModel.findById(scheduleId).select(
      "meetingLink"
    );
    if (schedule) {
      schedule.lastTimeJoinedClass = new Date();
      await schedule.save();
      return res.json({
        message: "Last time joined updated Successfully!",
        link: schedule.meetingLink,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong !",
    });
  }
};
