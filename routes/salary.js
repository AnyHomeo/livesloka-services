const express = require("express");
const router = express.Router();
const {
  getAllDatesOfSalaries,
  getSalariesOfAllTeachersByMonth,
  getSalariesOfTeacherByMonthAndId,
} = require("../controllers/salary.controller");

router.get("/months", getAllDatesOfSalaries);
router.get("/all", getSalariesOfAllTeachersByMonth);
router.get("/teacher/:id", getSalariesOfTeacherByMonthAndId);

module.exports = router;
