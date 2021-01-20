const express = require("express");
const router = express.Router();

const {
    GetTeacherSchedules
} = require("../controllers/Uploads.controller");

router.get("/getTeacherSchds", GetTeacherSchedules);


module.exports = router;