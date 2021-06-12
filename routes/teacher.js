const express = require("express");
const router = express.Router();

const {
  validateSlot,
  addSlot,
  getAvailableSlots,
  getTeachers,
  deleteSlot,
  getAllTEachers,
  getOccupancyDashboardData,
  getAllDaysSlots,
  GetTeacherMeetings,
  GetTeacherAttendance,
  joinClass,
  GetSalaries,
  getTeacherDetailsById,
} = require("../controllers/teacher.controller");

router.get("/join/:scheduleId/:teacherId", joinClass);
router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
router.post("/delete/slot/:id", validateSlot, deleteSlot);
router.get("/finance", getAllTEachers);
router.get("/occupancy", getOccupancyDashboardData);
router.get("/all/slots/:id", getAllDaysSlots);
router.get("/getTeacherMeetings/:id", GetTeacherMeetings);
router.get("/get/salary/:id", GetSalaries);
router.get("/get/teacherDetails/:id", getTeacherDetailsById);

module.exports = router;
