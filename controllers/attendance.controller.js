const Attendance = require("../models/Attendance");

const getAttendance = (req, res) => {
  const { id } = req.params;

  Attendance.find({
    customerId: id,
  })
    .select("date time")
    .then((userAttendance) => {
      return res.status(200).json({
        message: "Attendance Retrieved Successfully!",
        result: userAttendance,
      });
    })
    .catch((error) => {
      return res
        .status(500)
        .json({ error: "Error in Retrieving Attendance", result: null });
    });
};

module.exports = { getAttendance };
