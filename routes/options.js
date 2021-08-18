const express = require("express");
const { getOnlyDemoCustomers, getTeacherSlots, postAnOption } = require("../controllers/options");
const router = express.Router();

router.post('/',postAnOption);
router.get('/demo/students',getOnlyDemoCustomers);
router.get('/teacher/slots/:subject',getTeacherSlots);

module.exports = router;
