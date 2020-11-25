const express = require("express");
const {
  getCustomerMeeting,
  getCustomerData,
  getCustomersAllData,
} = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/meeting/:id", getCustomerMeeting);
router.get("/customer/data/:customerId", getCustomerData);
router.get("/customers/all", getCustomersAllData);

module.exports = router;
