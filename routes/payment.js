const express = require("express");
const {
  makePayment,
  onSuccess,
  onFailurePayment,
  getTransactions,
  getTest,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/pay", makePayment);
router.get("/success/:id", onSuccess);
router.get("/cancel/:id", onFailurePayment);
router.get("/get/transactions/:id", getTransactions);
module.exports = router;
