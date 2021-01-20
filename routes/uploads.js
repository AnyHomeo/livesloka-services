const express = require("express");
const router = express.Router();

const {
    GetTeacherSchedules,
    PostUpload
} = require("../controllers/Uploads.controller");

router.get("/getTeacherSchds/:id", GetTeacherSchedules);
router.post("/uploadMaterial", PostUpload)

module.exports = router;