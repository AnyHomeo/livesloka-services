const Schedule = require("../models/Scheduler.model");
const Customer = require("../models/Customer.model");
const Teacher = require("../models/Teacher.model");
const Subject = require("../models/Subject.model");
const { getStartAndEndTime } = require("../scripts/getStartAndEndTime");

exports.addSchedule = async (req, res) => {
  let {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    meetingLink,
    meetingAccount,
    teacher,
    students,
    demo,
    startDate,
    subject,
  } = req.body;

  monday = monday ? monday : [];
  tuesday = tuesday ? tuesday : [];
  wednesday = wednesday ? wednesday : [];
  thursday = thursday ? thursday : [];
  friday = friday ? friday : [];
  saturday = saturday ? saturday : [];
  sunday = sunday ? sunday : [];
  let className = "";

  try {
    let selectedSubject = await Subject.findOne({ _id: subject }).lean()
      .subjectName;
    let selectedTeacher = await Teacher.findOne({ _id: teacher }).lean()
      .TeacherName;
    className = `${selectedSubject} ${selectedTeacher} ${startDate} ${
      demo ? "Demo" : ""
    }`;
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Can't Add className",
    });
  }
  const schedule = new Schedule({
    meetingAccount,
    meetingLink,
    teacher,
    students,
    startDate,
    slots: {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    },
    demo,
    className,
  });
  schedule
    .save()
    .then((scheduledData) => {
      let scheduleDescription = "Attend meeting every";
      if (monday.length) {
        scheduleDescription += `Monday( ${getStartAndEndTime(monday)} )`;
      }
      if (tuesday.length) {
        scheduleDescription += `, Tuesday( ${getStartAndEndTime(tuesday)} )`;
      }
      if (wednesday.length) {
        scheduleDescription += `, Wednesday( ${getStartAndEndTime(
          wednesday
        )} ) `;
      }
      if (thursday.length) {
        scheduleDescription += `, Thursday( ${getStartAndEndTime(thursday)} )`;
      }
      if (friday.length) {
        scheduleDescription += `, Friday( ${getStartAndEndTime(friday)} ) `;
      }
      if (saturday.length) {
        scheduleDescription += `, Saturday( ${getStartAndEndTime(saturday)} )`;
      }
      if (sunday.length) {
        scheduleDescription += `, Sunday( ${getStartAndEndTime(sunday)} )`;
      }

      Customer.updateMany(
        { _id: { $in: students } },
        { meetingLink, scheduleDescription, className }
      )
        .then((data) => {
          Teacher.findOne({ id: teacher }).then((data) => {
            if (data) {
              let { availableSlots } = data;
              if (availableSlots) {
                Object.keys(scheduledData.slots).forEach((day) => {
                  let arr = scheduledData.slots[day];
                  arr.forEach((slot) => {
                    let index = availableSlots.indexOf(slot);
                    data.availableSlots.splice(index, 1);
                    data.scheduledSlots.push(slot);
                  });
                });
              }
              data.save((err, docs) => {
                if (err) {
                  console.log(err);
                  return res.status(500).json({
                    error: "error in updating teacher slots",
                  });
                } else {
                  return res.json({
                    message: "schedule saved successfully",
                  });
                }
              });
            }
          });
        })
        .catch((err) => {
          return res.status(400).json({
            error: "error in updating students Links and Description",
          });
          console.log(err);
        });
    })
    .catch((err) => {
      if (
        err.errors &&
        err.errors[Object.keys(err.errors)[0]].properties &&
        err.errors[Object.keys(err.errors)[0]].properties.message
      ) {
        return res.status(500).json({
          error: err.errors[Object.keys(err.errors)[0]].properties.message,
        });
      }
      console.log(err);
      return res.status(500).json({
        error: "Error in saving the schedule",
      });
    });
};

exports.deleteScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    let schedule = await Schedule.findById(id);
    let teacherOfSchedule = await Teacher.findOne({ id: schedule.teacher });
    const {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = schedule.slots;
    let slotsOfSchedule = monday
      .concat(tuesday)
      .concat(wednesday)
      .concat(thursday)
      .concat(friday)
      .concat(saturday)
      .concat(sunday);
    teacherOfSchedule.availableSlots = teacherOfSchedule.availableSlots.concat(
      slotsOfSchedule
    );
    teacherOfSchedule.availableSlots = [
      ...new Set(teacherOfSchedule.availableSlots),
    ];
    teacherOfSchedule.scheduledSlots = teacherOfSchedule.scheduledSlots.filter(
      (slot) => !slotsOfSchedule.includes(slot)
    );

    teacherOfSchedule.save((err, docs) => {
      if (err) {
        return res.status(500).json({
          error: "error in updating teacher",
        });
      }
      schedule.isDeleted = true;
      schedule.save((err, deletedSchedule) => {
        if (err) {
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

exports.getScheduleById = (req, res) => {
  const { id } = req.params;
  Schedule.findById(id)
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
