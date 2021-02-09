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

router.get("/getTeacherSchds/:id", GetTeacherSchedules);
router.post("/uploadMaterial", PostUpload);
router.get("/getStudentmaterial/:id", GetStudentsMaterial);
router.post("/assign", assignMaterial);
router.get("/teacher/:teacherId", getMaterialsByTeacherId);
router.delete("/delete/:materialId", deleteMaterial);

module.exports = router;
