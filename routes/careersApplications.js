const express = require("express");
const router = express.Router();
const { registerInCareers } = require("../controllers/careersApplications")

router.post("/",registerInCareers)

module.exports = router;
