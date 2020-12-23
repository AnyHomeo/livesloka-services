const express = require("express");
const router = express.Router();

const {
  getAttendance,
  postAttendance,
  getAllAttendanceByScheduleIdAndDate,
} = require("../controllers/attendance.controller");

//attendance Routes
router.get("/admin/attendance/:id", getAttendance);
router.post("/attendance", postAttendance);

router.get("/attendance/:scheduleId", getAllAttendanceByScheduleIdAndDate);

module.exports = router;
