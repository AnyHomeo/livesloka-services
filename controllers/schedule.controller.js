const Schedule = require("../models/Scheduler.model");
const Customer = require("../models/Customer.model");
const Teacher = require("../models/Teacher.model");
const { getStartAndEndTime } = require("../scripts/getStartAndEndTime");

exports.addSchedule = (req, res) => {
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
  } = req.body;

  monday = monday ? monday : [];
  tuesday = tuesday ? tuesday : [];
  wednesday = wednesday ? wednesday : [];
  thursday = thursday ? thursday : [];
  friday = friday ? friday : [];
  saturday = saturday ? saturday : [];
  sunday = sunday ? sunday : [];

  const schedule = new Schedule({
    meetingAccount,
    meetingLink,
    teacher,
    students,
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
        { meetingLink, scheduleDescription }
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
      return res.status(500).json({
        error: "Error in saving the schedule",
      });
    });
};
