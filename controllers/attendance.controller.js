const Attendance = require("../models/Attendance");
const CustomerModel = require("../models/Customer.model");

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
            dateArr[2] >= filterDateArr[2] &&
            dateArr[1] >= filterDateArr[1] &&
            dateArr[0] >= filterDateArr[0]
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
  const {
    scheduleId,
    date,
    customers,
    requestedStudents,
    absentees,
  } = req.body;
<<<<<<< HEAD
  Attendance.findOne({ $and: [{ scheduleId }, { date }] }).then((alreadyGivenAttendance) => {
    if (alreadyGivenAttendance) {
      console.log(alreadyGivenAttendance)
      let newlyRequestedStudents = [];
      requestedStudents.forEach((student) => {
        if (!alreadyGivenAttendance.requestedStudents.includes(student)) {
          newlyRequestedStudents.push(student);
        }
      });
      CustomerModel.updateMany(
        { _id: { $in: newlyRequestedStudents } },
        { $inc: { numberOfClassesBought: 1 } }
      )
        .then((data) => {
          // console.log(data);
        })
        .catch((err) => {
          console.log(err);
=======
  Attendance.findOne({ scheduleId, date })
    .then((alreadyGivenAttendance) => {
      if (alreadyGivenAttendance) {
        let newlyRequestedStudents = [];
        requestedStudents.forEach((student) => {
          if (!alreadyGivenAttendance.requestedStudents.includes(student)) {
            newlyRequestedStudents.push(student);
          }
>>>>>>> cb91a46b121609f581e24790fae7782ef0853ce9
        });
        CustomerModel.updateMany(
          { _id: { $in: newlyRequestedStudents } },
          { $inc: { numberOfClassesBought: 1 } }
        )
          .then((data) => {
            console.log(data);
          })
          .catch((err) => {
            console.log(err);
          });
<<<<<<< HEAD
        }
      });
    } else {
      CustomerModel.updateMany(
        { _id: { $in: [...customers, ...absentees] } },
        { $inc: { numberOfClassesBought: -1 } }
      )
        .then((data) => {
          // console.log(data);
        })
        .catch((err) => {
          console.log(err);
        });
      const attendance = new Attendance(req.body);
      console.log(attendance);
      attendance.save((err, doc) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            error: "Error in Taking Attendance",
          });
        } else {
          console.log(doc);
          return res.json({
            message: "Attendance Added successfully",
          });
        }
      });
    }
  });
=======
        alreadyGivenAttendance.customers = customers;
        alreadyGivenAttendance.absentees = absentees;
        alreadyGivenAttendance.requestedStudents = requestedStudents;
        alreadyGivenAttendance.save((err, savedAttendance) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: "Error in updating Attendance",
            });
          } else {
            console.log(savedAttendance);
            return res.json({
              message: "Attendance updated successfully",
            });
          }
        });
      } else {
        CustomerModel.updateMany(
          { _id: { $in: [...customers, ...absentees] } },
          { $inc: { numberOfClassesBought: -1 } }
        )
          .then((data) => {
            console.log(data);
          })
          .catch((err) => {
            console.log(err);
          });
        const attendance = new Attendance(req.body);
        attendance.save((err, doc) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              error: "Error in Taking Attendance",
            });
          } else {
            console.log(doc);
            return res.json({
              message: "Attendance Added successfully",
            });
          }
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
>>>>>>> cb91a46b121609f581e24790fae7782ef0853ce9
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

const getAttendanceByScheduleId = (req, res) => {
  const { scheduleId } = req.params;
  Attendance.find({ scheduleId })
    .populate("customers", "firstName email")
    .populate("requestedStudents", "firstName email")
    .populate("absentees", "firstName email")
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
  getAttendanceByScheduleId,
};
