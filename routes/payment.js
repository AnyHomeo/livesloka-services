const express = require("express");
const {
  makePayment,
  onSuccess,
  onFailurePayment,
} = require("../controllers/payment.controller");
const router = express.Router();

router.post("/pay", makePayment);
router.get("/success/:id", onSuccess);
router.get("/cancel/:id", onFailurePayment);

module.exports = router;
