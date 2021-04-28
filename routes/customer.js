const express = require("express");
const {
  getCustomerMeeting,
  getCustomerData,
  getCustomersAllData,
  getAllSchedulesByMail,
  getRequestedData,
  insertDataFromWix,
  getClassDashBoardData,
  getCustomersAllDataByUserIdSettings,
  getUserTimeZone,
  getSingleUser,
  getStatistics,
  updateLastTimeJoined
} = require("../controllers/Customer.controller");
const router = express.Router();

router.get("/user/info/:id", getSingleUser);
router.get("/customer/data/:customerId", getCustomerData);
router.get("/customer/timezone/:customerId", getUserTimeZone);
router.get("/customers/all", getCustomersAllData);
router.get("/customers/all/:userId", getCustomersAllDataByUserIdSettings);
router.post("/customer/schedules", getAllSchedulesByMail);
router.get("/customer/email", getRequestedData);
router.post("/customer/wixs", insertDataFromWix);
router.get("/customer/stats/:day", getStatistics);
router.post("/customer/join/:scheduleId/:email",updateLastTimeJoined);
router.get("/customer/class/dashboard", getClassDashBoardData);

module.exports = router;
