const TeacherModel = require("../models/Teacher.model");
const CustomerModel = require("../models/Customer.model");
const Category = require("../models/Category.model");
const Schedule = require("../models/Scheduler.model");
const Attendence = require("../models/Attendance");
const SchedulerModel = require("../models/Scheduler.model");
const CancelledClassesModel = require("../models/CancelledClasses.model");
const moment = require("moment");
const momentTZ = require("moment-timezone");
const TeacherLeavesModel = require("../models/TeacherLeaves.model");
const SubjectModel = require("../models/Subject.model");
const TimeZoneModel = require("../models/timeZone.model");
const { retrieveMeetingLink } = require("../config/util");

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

exports.addAvailableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot } = req.body;
    const teacher = await TeacherModel.findOne({ id });
    if (teacher) {
      if (teacher.scheduledSlots.includes(slot)) {
        let day = slot.split("-")[0].toLowerCase;
        const schedule = await SchedulerModel.find({
          teacher: id,
          ["slots." + day]: { $in: [slot] },
          isDeleted: { $ne: true },
        });
        if (schedule) {
          return res.status(400).json({
            message: "Cannot make available as it is already scheduled slot",
          });
        } else {
          teacher.scheduledSlots =  teacher.scheduledSlots.filter((scheduledSlot) => scheduledSlot !== slot)
          teacher.availableSlots.push(slot);
        }
      } else {
        if (teacher.availableSlots && Array.isArray(teacher.availableSlots)) {
          teacher.availableSlots.push(slot);
        } else {
          teacher.availableSlots = [slot];
        }
      }
      await teacher.save();
      return res.status(200).json({message: "Slot added successfully"})
    } else {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error?.message || "internal server error",
    });
  }
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
    let allCategories = await SubjectModel.find().select("id -_id subjectName");
    let allTeachers = await TeacherModel.find().select(
      "id TeacherName availableSlots scheduledSlots category subject"
    );
    let allSchedules = await Schedule.find({
      isDeleted: { $ne: true },
    })
      .populate(
        "students",
        "firstName lastName numberOfClassesBought email whatsAppnumber countryCode age timeZoneId"
      )
      .populate("group", "_id")
      .lean();

    let finalObject = {};
    allCategories.forEach((category) => {
      finalObject[category.subjectName] = {};
      allTeachers.forEach((teacher) => {
        if (teacher.subject === category.id) {
          const { TeacherName, scheduledSlots, availableSlots, _id, id } =
            teacher;

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

          finalObject[category.subjectName][TeacherName] = {
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
      result = await Promise.all(
        result.map(async (eachSchedule) => {
          let cancelledClasses = await CancelledClassesModel.find({
            scheduleId: eachSchedule._id,
            cancelledDate: {
              $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
            },
          }).populate("studentId", "firstName");
          return { ...eachSchedule, cancelledClasses };
        })
      );
      return res
        .status(200)
        .json({ message: "Fetched  meetings successfully", result });
    })
    .catch((err) => {
      console.log(err);
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
    let schedule = await SchedulerModel.findById(scheduleId)
      .select("meetingLink meetingLinks")
      .lean();
    if (schedule) {
      await SchedulerModel.updateOne(
        { _id: scheduleId },
        { $set: { lastTimeJoinedClass: new Date() } }
      );
      const link = retrieveMeetingLink(schedule);
      console.log(link);
      return res.json({
        message: "Last time joined updated Successfully!",
        link,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong !",
    });
  }
};

// get teacher details by id
exports.getTeacherDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacherDetails = await TeacherModel.findOne({ id });
    if (teacherDetails) {
      res.status(200).json({
        message: "Fetched Successfully",
        result: teacherDetails,
      });
    } else {
      res.status(404).json({
        message: "No teacher found",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Something went wrong",
    });
  }
};

exports.getTeacherLeavesAndSchedules = async (req, res) => {
  try {
    const { id } = req.params;
    let allSchedulesOfThatTeacher = await SchedulerModel.find({
      teacher: id,
      isDeleted: { $ne: true },
    })
      .select(
        "students slots className demo isClassTemperarilyCancelled message"
      )
      .populate("students", "firstName")
      .lean();
    let scheduleIds = allSchedulesOfThatTeacher.map((schedule) => schedule._id);
    let leavesOfTeacher = await TeacherLeavesModel.find({
      $or: [
        {
          scheduleId: {
            $in: scheduleIds,
          },
        },
        {
          entireDay: true,
        },
      ],
      date: {
        $gte: momentTZ().tz("Asia/Kolkata").startOf("week").format(),
        $lte: momentTZ().tz("Asia/Kolkata").endOf("week").format(),
      },
    });
    let entireDayLeavesDays = leavesOfTeacher
      .filter((leave) => leave.entireDay)
      .map((leave) =>
        momentTZ(leave.date).tz("Asia/Kolkata").format("dddd").toUpperCase()
      );
    let sortedSchedules = {};
    allSchedulesOfThatTeacher.forEach((schedule) => {
      Object.keys(schedule.slots).forEach((slot) => {
        let isOnLeave =
          leavesOfTeacher.findIndex(
            (leave) => leave.scheduleId && schedule._id.equals(leave.scheduleId)
          ) !== -1;
        schedule.slots[slot].forEach((hour) => {
          sortedSchedules[hour] = {
            ...schedule,
            slots: undefined,
            isOnLeave:
              isOnLeave || entireDayLeavesDays.includes(hour.split("-")[0]),
          };
        });
      });
    });

    return res.json({
      result: sortedSchedules,
      message: "Timetable Retrieved Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
