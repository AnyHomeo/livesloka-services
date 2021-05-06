const express = require("express");
const { getSummerCampSchedules } = require("../controllers/summerCamp.controller");
const router = express.Router();

router.get("/schedules",getSummerCampSchedules);

module.exports = router;
