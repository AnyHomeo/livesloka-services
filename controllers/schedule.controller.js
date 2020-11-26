const Schedule = require("../models/Scheduler.model");
const Customer = require("../models/Customer.model");

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
      let scheduleDescription = "Attend meeting every ";
      if (monday.length) {
        scheduleDescription += "Monday";
      }
      if (tuesday.length) {
        scheduleDescription += ", Tuesday";
      }
      if (wednesday.length) {
        scheduleDescription += ", Wednesday";
      }
      if (thursday.length) {
        scheduleDescription += ", Thursday";
      }
      if (friday.length) {
        scheduleDescription += ", Friday";
      }
      if (saturday.length) {
        scheduleDescription += ", Saturday";
      }
      if (sunday.length) {
        scheduleDescription += ", Sunday";
      }
      Customer.updateMany(
        { _id: { $in: students } },
        { meetingLink, scheduleDescription }
      )
        .then((data) => {
          return res.json({
            message: "schedule saved successfully",
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
