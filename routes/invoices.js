const express = require('express');
const {
  getInvoicesByTransactionId,
  getInvoices,
  storeAllExhangeRates,
  createAllInvoices,
} = require('../controllers/invoices.controller');
const router = express.Router();

router.get('/', getInvoices);
router.get('/transactions/:id', getInvoicesByTransactionId);
// router.get('/forex', storeAllExhangeRates);
// router.get('/create-invoices', createAllInvoices);

module.exports = router;
