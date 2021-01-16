const Attendance = require("../models/Attendance");

exports.getAllDatesOfSalaries = async (req, res) => {
  try {
    const allDates = await Attendance.find().distinct("date");
    let finalArr = [];
    allDates.forEach((date) => {
      let splittedDate = date.split("-");
      if (
        splittedDate.length === 3 &&
        !finalArr.includes(`${splittedDate[0]}-${splittedDate[1]}`)
      ) {
        finalArr.push(`${splittedDate[0]}-${splittedDate[1]}`);
      }
    });
    return res.json({
      message: "Salary months Retrieved Successfully!",
      result: finalArr,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retrieving dates",
    });
  }
};
