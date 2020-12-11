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

} = require("../controllers/teacher.controller");

router.post("/add/available/:id", validateSlot, addSlot);
router.get("/available/:id", getAvailableSlots);
router.get("/", getTeachers);
router.post("/delete/slot/:id", validateSlot, deleteSlot);
router.get("/finance", getAllTEachers);
router.get("/occupancy", getOccupancyDashboardData);
router.get("/all/slots/:id", getAllDaysSlots);

router.get("/getTeacherMeetings/:id", GetTeacherMeetings)
module.exports = router;
