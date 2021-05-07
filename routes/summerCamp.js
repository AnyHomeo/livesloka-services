const express = require("express");
const {  getSummerCampDataWithSchedules } = require("../controllers/summerCamp.controller");
const router = express.Router();

router.get("/subject/:id",getSummerCampDataWithSchedules);

module.exports = router;
