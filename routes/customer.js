const express = require("express");
const {
  getCustomerMeeting,
  getCustomerData,
  getCustomersAllData,
  getAllSchedulesByMail,
  getRequestedData,
} = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/customer/data/:customerId", getCustomerData);
router.get("/customers/all", getCustomersAllData);
router.post("/customer/schedules", getAllSchedulesByMail);
router.get("/customer/email", getRequestedData);

module.exports = router;
