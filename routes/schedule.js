const express = require("express");
const router = express.Router();
const { addSchedule } = require("../controllers/schedule.controller");

router.post("/", addSchedule);

module.exports = router;
