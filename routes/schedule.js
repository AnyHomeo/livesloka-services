const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
  deleteScheduleById,
  editSchedule,
  getAllSchedules,
  getAllSchedulesByZoomAccountId,
  getAllScheduleswithZoomAccountSorted,
  dangerousScheduleUpdate,
  editIfWhereby,
  changeZoomLink,
  getSchedulesByScheduleIdAndTime,
  getPresentAndNextScheduleOfATeacher
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.post("/dangerous/edit/:scheduleId", dangerousScheduleUpdate);
router.post("/edit/:id",editIfWhereby,editSchedule);
router.get("/delete/:id", deleteScheduleById);
router.get("/data/all", getAllSchedules);
router.get("/zoom/all", getAllScheduleswithZoomAccountSorted);
router.get("/zoom/:id", getAllSchedulesByZoomAccountId);
router.get("/:id", getScheduleById);
router.put('/zoom/:scheduleId',changeZoomLink);
router.get('/salary/:scheduleId/:date',getSchedulesByScheduleIdAndTime)
router.get('/teacher/present/:teacherId/:slot',getPresentAndNextScheduleOfATeacher)
module.exports = router;