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
  editIfWhereby
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.post("/dangerous/edit/:scheduleId", dangerousScheduleUpdate);
router.post("/edit/:id",editIfWhereby,editSchedule);
router.get("/delete/:id", deleteScheduleById);
router.get("/data/all", getAllSchedules);
router.get("/zoom/all", getAllScheduleswithZoomAccountSorted);
router.get("/zoom/:id", getAllSchedulesByZoomAccountId);
router.get("/:id", getScheduleById);
module.exports = router;
