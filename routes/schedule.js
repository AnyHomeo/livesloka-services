const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
  deleteScheduleById,
  editSchedule,
  getAllSchedules,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.post("/edit/:id", editSchedule);
router.get("/:id", getScheduleById);
router.get("/delete/:id", deleteScheduleById);
router.get("/data/all", getAllSchedules);
module.exports = router;
