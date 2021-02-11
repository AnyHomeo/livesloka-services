const express = require("express");
const router = express.Router();

const {
  GetTeacherSchedules,
  PostUpload,
  GetStudentsMaterial,
  assignMaterial,
  getMaterialsByTeacherId,
  deleteMaterial,
} = require("../controllers/Uploads.controller");

router.get("/schedules/:id", GetTeacherSchedules);
router.post("/material", PostUpload);
router.get("/student/:id", GetStudentsMaterial);
router.post("/assign", assignMaterial);
router.get("/teacher/:teacherId", getMaterialsByTeacherId);
router.delete("/delete/:materialId", deleteMaterial);

module.exports = router;
