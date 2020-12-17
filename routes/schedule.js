const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
  deleteScheduleById,
  editSchedule,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.post("/edit/:id", editSchedule);
router.get("/:id", getScheduleById);
router.get("/delete/:id", deleteScheduleById);

module.exports = router;
