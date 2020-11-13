const express = require("express");
const { getCustomerMeeting } = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/meeting/:id", getCustomerMeeting);

module.exports = router;
