const express = require("express");
const {
  getCustomerMeeting,
  getCustomerData,
} = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/meeting/:id", getCustomerMeeting);
router.get("/customer/data/:customerId", getCustomerData);

module.exports = router;
