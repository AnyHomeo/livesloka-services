const express = require("express");
const router = express.Router();

const {
    GetTeacherSchedules,
    PostUpload,
    GetStudentsMaterial
} = require("../controllers/Uploads.controller");

router.get("/getTeacherSchds/:id", GetTeacherSchedules);
router.post("/uploadMaterial", PostUpload)
router.get("/getStudentmaterial/:id", GetStudentsMaterial)

module.exports = router;