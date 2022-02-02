const express = require("express");
const {
    getInvoicesByTransactionId, 
    getInvoices
} = require("../controllers/invoices.controller");
const router = express.Router();

// router.get("/", createAllInvoices);

router.get("/",getInvoices);
router.get("/transactions/:id", getInvoicesByTransactionId);

module.exports = router;
