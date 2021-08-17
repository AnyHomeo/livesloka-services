const express = require("express");
const { getOnlyDemoCustomers, getTeacherSlots } = require("../controllers/options");
const router = express.Router();

router.get('/demo/students',getOnlyDemoCustomers);
router.get('/teacher/slots/:subject',getTeacherSlots);

module.exports = router;
