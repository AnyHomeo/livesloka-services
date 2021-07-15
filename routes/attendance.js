const express = require("express");
const router = express.Router();

const {
  getAttendance,
  postAttendance,
  getAllAttendanceByScheduleIdAndDate,
  getAttendanceByScheduleId,
  getAttendanceWithPayments
} = require("../controllers/attendance.controller");

//attendance Routes
router.get("/admin/attendance/:id", getAttendance);
router.post("/attendance", postAttendance);
router.get("/attendance/:scheduleId", getAllAttendanceByScheduleIdAndDate);
router.get("/attendance/all/:scheduleId", getAttendanceByScheduleId);
router.get("/user/history/:email",getAttendanceWithPayments)
module.exports = router;