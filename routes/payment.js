const express = require('express');
const {
  makePayment,
  onSuccess,
  onFailurePayment,
  getTransactions,
  getAllTransactions,
  getDailyDataGraph,
  onRazorpaySuccess,
  razorpayWebhook,
  validateRazorpayWebhook,
} = require('../controllers/payment.controller');
const router = express.Router();

router.post('/pay', makePayment);
router.get('/success/:id', onSuccess);
router.get('/razorpay/success/:id', onRazorpaySuccess);
router.get('/cancel/:id', onFailurePayment);
router.get('/get/transactions/:id', getTransactions);
router.get('/get/alltransactions/', getAllTransactions);
router.get('/get/dailydatagraph/', getDailyDataGraph);
router.post('/razorpay/webhook', validateRazorpayWebhook, razorpayWebhook);
module.exports = router;
