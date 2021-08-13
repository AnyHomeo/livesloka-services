const express = require("express");
const router = express.Router();
const { createProduct,createPlan } = require("../controllers/subscriptions");

router.post("/create/product",createProduct);
router.post("/create/plan",createPlan);

module.exports = router;