const express = require('express');
const {
  createAPayment,
  handlePaypalCancelledPayment,
  handlePaypalSuccessfulPayment,
  handleSuccessfulRazorpayPayment,
} = require('../controllers/payments');
const router = express.Router();

router.post('/:planId/:customerId', createAPayment);
router.get('/paypal/:planId/:customerId/cancel', handlePaypalCancelledPayment);
router.get(
  '/paypal/:planId/:customerId/success',
  handlePaypalSuccessfulPayment
);
router.get(
  '/razorpay/success/:planId/:customerId',
  handleSuccessfulRazorpayPayment
);
module.exports = router;
