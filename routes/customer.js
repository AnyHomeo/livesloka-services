const express = require('express');
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
  updateLastTimeJoined,
  getInclassAndDemoStudents,
  insertCustomersFromWebsite,
  getCustomerDataByFilters,
  getCustomerByEmail,
  UpdateProfilePicByEmail,
  dataByUserID,
  dataByUserIDs,
  getAdminById,
} = require('../controllers/Customer.controller');
const router = express.Router();

router.get('/user/info/:id', getSingleUser);
router.get('/all/demo-inclass', getInclassAndDemoStudents);
router.get('/customer/filters', getCustomerDataByFilters);
router.get('/customer/data/:customerId', getCustomerData);
router.get('/customer/timezone/:customerId', getUserTimeZone);
router.get('/customers/all', getCustomersAllData);
router.get('/customers/all/:userId', getCustomersAllDataByUserIdSettings);
router.post('/customer/schedules', getAllSchedulesByMail);
router.get('/customer/email', getRequestedData);
router.post('/customer/wixs', insertDataFromWix);
router.get('/customer/stats/:day', getStatistics);
router.post('/customer/join/:scheduleId/:email', updateLastTimeJoined);
router.get('/customer/class/dashboard', getClassDashBoardData);
router.post('/register/customer', insertCustomersFromWebsite);
router.get('/get/customer/:email', getCustomerByEmail);
router.post('/update/customerPic/', UpdateProfilePicByEmail);
router.get('/ByUserID/:userId', dataByUserID);
router.get('/getAdminById/:userId', getAdminById);

module.exports = router;
