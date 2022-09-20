const express = require('express');
const {
  getSummerCampSchedules,
  registerCustomer,
  onSummerCampSuccessfulPayment,
  onSummerCampFailurePayment,
  getSummerCampStudents,
} = require('../controllers/summerCamp.controller');
const router = express.Router();

router.get('/', getSummerCampSchedules);
router.post('/register', registerCustomer);
router.get('/students', getSummerCampStudents);
router.get('/payment/success/:customerId', onSummerCampSuccessfulPayment);
router.get('/payment/cancel/:customerId', onSummerCampFailurePayment);

module.exports = router;
