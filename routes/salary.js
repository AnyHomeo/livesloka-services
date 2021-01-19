const express = require("express");
const router = express.Router();
const {
  getAllDatesOfSalaries,
  getSalariesOfAllTeachersByMonth,
} = require("../controllers/salary.controller");

router.get("/months", getAllDatesOfSalaries);
router.get("/all", getSalariesOfAllTeachersByMonth);

module.exports = router;
