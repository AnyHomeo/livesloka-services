const express = require("express");
const { isAdmin, isLoggedId } = require("../controllers/helpers.js");
const router = express.Router();

const {
  getTeachersCategoried,
  getTeacherSchedules,
} = require("../controllers/mobileTeacher.js");

router.get(
  "/categories",
  //   isLoggedId,isAdmin,
  getTeachersCategoried
);
router.get(
  "/:teacherId/schedules",
  //   isLoggedId,isAdmin,
  getTeacherSchedules
);
module.exports = router;
