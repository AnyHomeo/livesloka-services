const express = require("express");
const {
  makePayment,
  onSuccess,
  onFailurePayment,
  getTransactions,
  getAllTransactions,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/pay", makePayment);
router.get("/success/:id", onSuccess);
router.get("/cancel/:id", onFailurePayment);
router.get("/get/transactions/:id", getTransactions);
router.get("/get/alltransactions/", getAllTransactions);
module.exports = router;
