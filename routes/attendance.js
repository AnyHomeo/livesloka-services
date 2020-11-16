const express = require("express");
const router = express.Router();

const { getAttendance } = require("../controllers/attendance.controller");

//attendance Routes
router.get("/admin/attendance/:id", getAttendance);

module.exports = router;
