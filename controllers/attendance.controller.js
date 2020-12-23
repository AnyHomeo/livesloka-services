const Attendance = require("../models/Attendance");

const getAttendance = (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  Attendance.find({
    customers: { $in: [id] },
  })
    .select("date time scheduleId")
    .populate("Schedule")
    .then((userAttendance) => {
      if (date) {
        let filteredData = [];
        let filterDateArr = date.split("-").map((num) => parseInt(num));
        userAttendance.forEach((attendance) => {
          let dateArr = attendance.date.split("-").map((num) => parseInt(num));
          if (
            dateArr[0] >= filterDateArr[0] &&
            dateArr[1] >= filterDateArr[1] &&
            dateArr[2] >= filterDateArr[2]
          ) {
            filteredData.push(attendance);
          }
        });
        userAttendance = filteredData;
      }
      return res.status(200).json({
        message: "Attendance Retrieved Successfully!",
        result: userAttendance,
      });
    })
    .catch((error) => {
      console.log(error);
      return res
        .status(500)
        .json({ error: "Error in Retrieving Attendance", result: null });
    });
};

const postAttendance = (req, res) => {
  const { scheduleId, date, customers } = req.body;
  Attendance.findOne({ scheduleId, date }).then((alreadyGivenAttendance) => {
    if (alreadyGivenAttendance) {
      alreadyGivenAttendance.customers = customers;
      alreadyGivenAttendance.save((err, savedAttendance) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            error: "Error in updating Attendance",
          });
        } else {
          return res.json({
            message: "Attendance updated successfully",
          });
        }
      });
    } else {
      const attendance = new Attendance(req.body);
      attendance.save((err, doc) => {
        if (err) {
          return res.status(500).json({
            error: "Error in Taking Attendance",
          });
        } else {
          return res.json({
            message: "Attendance Added successfully",
          });
        }
      });
    }
  });
};

const getAllAttendanceByScheduleIdAndDate = (req, res) => {
  const { scheduleId } = req.params;
  const { date } = req.query;
  Attendance.findOne({ scheduleId, date })
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

module.exports = {
  getAttendance,
  postAttendance,
  getAllAttendanceByScheduleIdAndDate,
};
