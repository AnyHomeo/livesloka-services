require("dotenv").config();
const Schedule = require("../models/Scheduler.model");
const Attendance = require("../models/Attendance");
const Customer = require("../models/Customer.model");
const Teacher = require("../models/Teacher.model");
const Subject = require("../models/Subject.model");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const fetch = require("node-fetch");
const SchedulerModel = require("../models/Scheduler.model");
const TeacherModel = require("../models/Teacher.model");
const moment = require("moment");
const momentTZ = require("moment-timezone");
const Payments = require("../models/Payments");
const times = require("../models/times.json");
const CancelledClassesModel = require("../models/CancelledClasses.model");
const {
  createSlotsZoomLink,
  generateSlots,
  updateTeacherWithSchedule,
  updateCustomersWithSchedule,
  updateOldTeacherByRemovingOldSlots,
  findIfNewMeetingLinkNeeded,
  updateCustomerWithUpdatedSchedule,
  deleteExistingZoomLinkOfTheSchedule,
} = require("../config/util");

exports.createNewSchedule = async (req, res) => {
  try {
    const {
      className,
      teacher,
      startDate,
      demo,
      oneToMany,
      oneToOne,
      subject,
      students,
    } = req.body;
    if (!students || !Array.isArray(students) || !students.length)
      return res.status(400).json({ message: "Students are required" });

    const [slots] = generateSlots(req.body);
    const meetingLinks = await createSlotsZoomLink(slots);

    // create new schedule
    const schedule = new Schedule({
      className,
      teacher,
      startDate,
      slots,
      meetingLinks,
      demo,
      oneToMany,
      oneToOne,
      subject,
      students,
    });

    await schedule.save();
    await updateCustomersWithSchedule(schedule);
    await updateTeacherWithSchedule(schedule);
    return res.json({
      message: "Schedule saved successfully",
      result: schedule,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error,
      message: error.message,
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    let { slots, isMeetingLinkChangeNeeded } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule)
      return res.status(404).json({
        message: "Invalid schedule",
      });

    // find if new link needs to be generated
    const isNewMeetingLinkNeeded = await findIfNewMeetingLinkNeeded(
      scheduleId,
      slots,
      isMeetingLinkChangeNeeded
    );

    await updateOldTeacherByRemovingOldSlots(schedule.teacher, schedule.slots);

    let meetingLinks;
    if (isNewMeetingLinkNeeded) {
      meetingLinks = await createSlotsZoomLink(slots);
      if (typeof meetingLinks.message === "string") {
        throw new Error(meetingLinks.message);
      } else {
        await deleteExistingZoomLinkOfTheSchedule(schedule);
        console.log("NEW", { meetingLinks });
        req.body.meetingLinks = meetingLinks;
      }
    }

    let newSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { $set: { ...req.body } },
      { new: true, useFindAndModify: false }
    );

    await updateCustomerWithUpdatedSchedule(newSchedule, schedule);
    await updateTeacherWithSchedule(newSchedule);

    return res.json({
      message: "Schedule updated successfully",
      result: newSchedule,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error,
      message: error.message,
    });
  }
};

exports.deleteScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    let schedule = await Schedule.findById(id);
    let { students } = schedule;
    let teacherOfSchedule = await Teacher.findOne({ id: schedule.teacher });
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      schedule.slots;
    let slotsOfSchedule = monday
      .concat(tuesday)
      .concat(wednesday)
      .concat(thursday)
      .concat(friday)
      .concat(saturday)
      .concat(sunday);
    teacherOfSchedule.availableSlots =
      teacherOfSchedule.availableSlots.concat(slotsOfSchedule);
    teacherOfSchedule.availableSlots = [
      ...new Set(teacherOfSchedule.availableSlots),
    ];
    teacherOfSchedule.scheduledSlots = teacherOfSchedule.scheduledSlots.filter(
      (slot) => !slotsOfSchedule.includes(slot)
    );
    const { meetingAccount, meetingLink, isZoomMeeting } = schedule;
    const meetingAccountData = await ZoomAccountModel.findById(meetingAccount);
    if (meetingAccountData && isZoomMeeting && meetingLink.includes("zoom")) {
      await fetch(
        `https://api.zoom.us/v2/meetings/${
          meetingLink.split("/")[4].split("?")[0]
        }`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${meetingAccountData.zoomJwt}`,
          },
        }
      );
    }

    if (isZoomMeeting) {
      const ZoomAccountDetails = await ZoomAccountModel.findById(
        meetingAccount
      );
      if (ZoomAccountDetails) {
        slotsOfSchedule.forEach((slot) => {
          let slotIndex = ZoomAccountDetails.timeSlots.indexOf(slot);
          if (slotIndex != -1) {
            ZoomAccountDetails.timeSlots.splice(slotIndex, 1);
          }
        });
        await ZoomAccountDetails.save();
      }
    }
    teacherOfSchedule.save((err, docs) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "error in updating teacher",
        });
      }
      schedule.isDeleted = true;
      schedule.lastTimeJoinedClass = undefined;
      delete schedule.startDate;
      schedule.save((err, deletedSchedule) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            error: "error in updating teacher",
          });
        }
        return res.status(200).json({
          message: "Schedule Deleted Successfully",
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in Deleting Schedule",
    });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await SchedulerModel.findById(id);
    if(schedule){
      const teacher = await Teacher.findOne({ id: schedule.teacher });
      const [_, allSlots] = generateSlots(schedule.slots);
      if(teacher){
        teacher.availableSlots = [
          ...new Set([...teacher.availableSlots, ...allSlots]),
        ];
        teacher.scheduledSlots = teacher.scheduledSlots.filter(
          (slot) => !allSlots.includes(slot)
        );
        await teacher.save();
      }
  
      await deleteExistingZoomLinkOfTheSchedule(schedule, false);
      schedule.isDeleted = true;
      schedule.lastTimeJoinedClass = undefined;
      schedule.startDate = undefined;
      await schedule.save();
    }
    return res.status(200).json({
      message: "Schedule Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getScheduleById = (req, res) => {
  const { id } = req.params;
  Schedule.findById(id)
    .populate(
      "students",
      "firstName lastName phone whatsAppnumber meetingLink email numberOfClassesBought"
    )
    .then((data) => {
      return res.status(200).json({
        message: "Schedule Retrieved Successfully",
        result: data,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Internal server error",
        result: null,
      });
    });
};

exports.getAllSchedules = (req, res) => {
  let { params } = req.query;
  params = params ? params.split(",").join(" ") : "";
  Schedule.find({
    isDeleted: {
      $ne: true,
    },
  })
    .select(params)
    .then((allSchedules) => {
      return res.json({
        result: allSchedules,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error: "Internal Server error",
      });
    });
};

exports.getAllSchedulesByZoomAccountId = async (req, res) => {
  try {
    const { id } = req.params;
    const schedules = await SchedulerModel.find({
      meetingAccount: id,
      isDeleted: { $ne: true },
    });
    return res.json({
      result: schedules,
      message: "Schedules retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retreiving data",
    });
  }
};

exports.getAllScheduleswithZoomAccountSorted = async (req, res) => {
  try {
    const { day } = req.query;
    const schedules = await SchedulerModel.find({
      isDeleted: { $ne: true },
      meetingLinks: { $exists: true },
    })
      .select("slots meetingLinks className")
      .sort({ meetingAccount: -1 })
      .lean();

    console.log(schedules.length);

    const allZoomAccounts = await ZoomAccountModel.find()
      .select("color ZoomAccountName isDisabled timeSlots")
      .sort({ createdAt: -1 })
      .lean();

    let finalSortedData = {};
    allZoomAccounts.forEach((zoomAccount) => {
      finalSortedData[zoomAccount.ZoomAccountName] = {};
      finalSortedData[zoomAccount.ZoomAccountName] = {
        ...zoomAccount,
        schedules: [],
      };

      schedules.forEach((schedule) => {
        if (
          schedule.meetingLinks &&
          Object.values(schedule.meetingLinks).length &&
          schedule.meetingLinks[day] &&
          schedule.meetingLinks[day].meetingAccount.toString() ===
            zoomAccount._id.toString()
        ) {
          console.log("SLOTS", schedule);
          schedule.slots = schedule.slots[day];
          finalSortedData[zoomAccount.ZoomAccountName].schedules.push(
            schedule
          );
        }
      });
    });

    return res.json({
      message: "Zoom accounts retrieved successfully",
      result: finalSortedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
};

exports.getZoomAccountDashboardOfDay = async (req, res) => {
  try {
    const { day } = req.query;
    if (!day)
      return res.status(404).json({
        message: "Day needs to be provided",
      });
    const schedules = await SchedulerModel.find({
      ["meetingLinks." + day]: {
        $exists: true,
      },
      isDeleted: false,
    })
      .select("slots meetingLinks className")
      .sort({ meetingAccount: -1 })
      .lean();

    const allZoomAccounts = await ZoomAccountModel.find()
      .select("color ZoomAccountName isDisabled timeSlots")
      .sort({ createdAt: -1 })
      .lean();

    let result = allZoomAccounts.map((zoomAccount) => {
      return {
        ...zoomAccount,
        timeSlots: zoomAccount.timeSlots.reduce((slotsAcc, slot) => {
          let filteredSchedules = schedules.filter((schedule) => {
            return (
              schedule.slots[day].includes(slot) &&
              schedule.meetingLinks.[day].meetingAccount.toString() ===
                zoomAccount._id.toString()
            );
          });
          if (slot.startsWith(day.toUpperCase())) {
            slotsAcc[slot] = filteredSchedules;
          }
          return slotsAcc;
        }, {}),
      };
    });

    return res.json({
      message: "Zoom accounts retrieved successfully",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};

exports.dangerousScheduleUpdate = async (req, res) => {
  const { message } = req.query;
  try {
    const { scheduleId } = req.params;
    // if (typeof req.body.isClassTemperarilyCancelled != "undefined") {
    //   if (req.body.isClassTemperarilyCancelled) {
    //     const schedule = await SchedulerModel.findById(scheduleId);
    //     await deleteExistingZoomLinkOfTheSchedule(schedule);
    //   } else {
    //     let schedule = await SchedulerModel.findById(scheduleId);
    //     const { slots } = schedule;

    //     const meetingLinks = await createSlotsZoomLink(slots);
    //     if (typeof meetingLinks.message !== "string") {
    //       await deleteExistingZoomLinkOfTheSchedule(schedule);
    //     }

    //     await Schedule.findByIdAndUpdate(
    //       scheduleId,
    //       { $set: { meetingLinks } },
    //       { new: true, useFindAndModify: false }
    //     );
    //   }
    // }
    await SchedulerModel.updateOne({ _id: scheduleId }, { ...req.body });

    return res.json({
      message: message ? message + " successful" : "Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: message ? message + " failed" : "Internal Server Error",
    });
  }
};

exports.changeZoomLink = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    let schedule = await SchedulerModel.findById(scheduleId);
    const { slots } = schedule;

    const meetingLinks = await createSlotsZoomLink(slots);
    if (typeof meetingLinks.message === "string") {
      throw new Error(meetingLinks.message);
    } else {
      await deleteExistingZoomLinkOfTheSchedule(schedule);
    }

    let newSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { $set: { meetingLinks } },
      { new: true, useFindAndModify: false }
    );

    return res.status(200).json({
      message: "Meeting Link Updated successfully!",
      result: newSchedule,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err.message || "something went wrong",
    });
  }
};

exports.getSchedulesByScheduleIdAndTime = (req, res) => {
  const { scheduleId, date } = req.params;
  let month = parseInt(date.split("-")[1]) - 1;
  let year = date.split("-")[0];
  Attendance.find({
    scheduleId,
    createdAt: {
      $gte: moment()
        .set("month", month)
        .set("year", year)
        .startOf("month")
        .format(),
      $lte: moment()
        .set("month", month)
        .set("year", year)
        .endOf("month")
        .format(),
    },
  })
    .populate("customers", "firstName email")
    .populate("requestedStudents", "firstName email")
    .populate("requestedPaidStudents", "firstName email")
    .populate("absentees", "firstName email")
    .populate("requestedPaidStudents", "firstName email")
    .then((data) => {
      return res.json({
        message: "Attendance retrieved successfully",
        result: data,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving Attendance",
      });
    });
};

const getNextSlot = (scheduledSlots, slot, presentMeetingSlots) => {
  let day = slot.split("-")[0].toUpperCase();
  let slotWithoutDay = slot.split("-")[1] + "-" + slot.split("-")[2];
  let index = times.indexOf(slotWithoutDay);
  let allNextSlots = times.slice(index);
  let nextSlot = "";
  for (let i = 0; i < allNextSlots.length; i++) {
    let x = day + "-" + allNextSlots[i];
    if (scheduledSlots.includes(x) && !presentMeetingSlots.includes(x)) {
      nextSlot = x;
      break;
    }
  }
  return nextSlot;
};

exports.getPresentAndNextScheduleOfATeacher = async (req, res) => {
  try {
    const { teacherId, slot } = req.params;
    let teacher = await Teacher.findOne({ id: teacherId }).lean();
    let { scheduledSlots } = teacher;
    let day = slot.split("-")[0].toLowerCase();
    let scheduleRightNow = await SchedulerModel.findOne({
      teacher: teacherId,
      [`slots.${day}`]: {
        $in: [slot],
      },
      isDeleted: false,
    }).populate("students", "firstName");
    let nextSlot = "";
    if (scheduleRightNow) {
      nextSlot = getNextSlot(scheduledSlots, slot, scheduleRightNow.slots[day]);
    } else {
      nextSlot = getNextSlot(scheduledSlots, slot, []);
    }
    let nextSchedule = await SchedulerModel.findOne({
      teacher: teacherId,
      [`slots.${day}`]: {
        $in: [nextSlot],
      },
      isDeleted: false,
    }).populate("students", "firstName");

    let idsToNotToRetrieve = [];
    if (scheduleRightNow) {
      idsToNotToRetrieve.push(scheduleRightNow._id);
    }
    if (nextSchedule) {
      idsToNotToRetrieve.push(nextSchedule._id);
    }

    let otherSchedules = await SchedulerModel.find({
      _id: {
        $nin: idsToNotToRetrieve,
      },
      teacher: teacherId,
      ["slots." + day + ".0"]: { $exists: true },
      isDeleted: false,
    });

    let teacherSchedules = await SchedulerModel.find({
      teacher: teacherId,
    }).select("_id");

    teacherSchedules = teacherSchedules.map((schedule) => schedule._id);

    let todayLeaves = await CancelledClassesModel.find({
      scheduleId: {
        $in: teacherSchedules,
      },
      cancelledDate: {
        $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
        $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
      },
    })
      .populate("studentId", "firstName")
      .populate("scheduleId", "className");

    let tomorrowLeaves = await CancelledClassesModel.find({
      scheduleId: {
        $in: teacherSchedules,
      },
      cancelledDate: {
        $gte: momentTZ()
          .tz("Asia/Kolkata")
          .add(1, "day")
          .startOf("day")
          .format(),
        $lte: momentTZ().tz("Asia/Kolkata").add(1, "day").endOf("day").format(),
      },
    })
      .populate("studentId", "firstName")
      .populate("scheduleId", "className");

    return res.json({
      result: {
        scheduleRightNow,
        nextSchedule,
        otherSchedules,
        todayLeaves,
        tomorrowLeaves,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};

exports.deleteAllZoomMeetings = async (req, res) => {
  try {
    const allMeetings = await SchedulerModel.find({
      isDeleted: { $ne: true },
    });

    const allAccounts = await ZoomAccountModel.find({}).lean();

    // update all Accounts with [] timeSlots
    await ZoomAccountModel.update({}, { timeSlots: [] });

    allMeetings.forEach((schedule) => {
      const { meetingLink, meetingAccount } = schedule;
      if (meetingAccount && meetingLink) {
        deleteExistingZoomLinkOfTheSchedule(schedule, true);
      }
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
    });
  }
};
