const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
  deleteScheduleById,
  editSchedule,
  getAllSchedules,
  getAllSchedulesByZoomAccountId,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.post("/edit/:id", editSchedule);
router.get("/delete/:id", deleteScheduleById);
router.get("/data/all", getAllSchedules);
router.get("/zoom/:id", getAllSchedulesByZoomAccountId);
router.get("/:id", getScheduleById);
module.exports = router;
