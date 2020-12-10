const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getScheduleById,
} = require("../controllers/schedule.controller");

router.post("/", addSchedule);
router.get("/:id", getScheduleById);

module.exports = router;
