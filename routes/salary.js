const express = require("express");
const router = express.Router();
const { getAllDatesOfSalaries } = require("../controllers/salary.controller");

router.get("/months", getAllDatesOfSalaries);

module.exports = router;
