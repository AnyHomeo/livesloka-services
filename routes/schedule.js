const express = require("express");
const router = express.Router();
const {
  getScheduleById,
  getAllSchedules,
  getAllSchedulesByZoomAccountId,
  dangerousScheduleUpdate,
  changeZoomLink,
  getSchedulesByScheduleIdAndTime,
  getPresentAndNextScheduleOfATeacher,
  createNewSchedule,
  updateSchedule,
  deleteAllZoomMeetings,
  getZoomAccountDashboardOfDay,
  deleteSchedule
} = require("../controllers/schedule.controller");

router.post("/", createNewSchedule);
 router.get("/", deleteAllZoomMeetings);
router.post("/dangerous/edit/:scheduleId", dangerousScheduleUpdate);
router.post("/edit/:scheduleId",updateSchedule);
router.get("/delete/:id", deleteSchedule);
router.get("/data/all", getAllSchedules);
router.get("/zoom/all", getZoomAccountDashboardOfDay);
router.get("/zoom/:id", getAllSchedulesByZoomAccountId);
router.get("/:id", getScheduleById);
router.put('/zoom/:scheduleId',changeZoomLink);
router.get('/salary/:scheduleId/:date',getSchedulesByScheduleIdAndTime)
router.get('/teacher/present/:teacherId/:slot',getPresentAndNextScheduleOfATeacher)
module.exports = router;