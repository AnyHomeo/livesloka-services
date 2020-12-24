const express = require("express");
const {
  getCustomerMeeting,
  getCustomerData,
  getCustomersAllData,
  getAllSchedulesByMail,
} = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/customer/data/:customerId", getCustomerData);
router.get("/customers/all", getCustomersAllData);
router.post("/customer/schedules", getAllSchedulesByMail);

module.exports = router;
