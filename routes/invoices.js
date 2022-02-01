const express = require("express");
const {
    getInvoicesByTransactionId, 
    createAllInvoices
} = require("../controllers/invoices.controller");
const router = express.Router();

// router.get("/", createAllInvoices);
router.get("/transactions/:id", getInvoicesByTransactionId);

module.exports = router;
