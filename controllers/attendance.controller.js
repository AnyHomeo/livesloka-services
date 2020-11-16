const Attendance = require("../models/Attendance");

const getAttendance = (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  Attendance.find({
    customerId: id,
  })
    .select("date time timeZone")
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

module.exports = { getAttendance };
