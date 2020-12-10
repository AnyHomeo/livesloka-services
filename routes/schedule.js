const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
  deleteScheduleById,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.get("/:id", getScheduleById);
router.get("/delete/:id", deleteScheduleById);

module.exports = router;
