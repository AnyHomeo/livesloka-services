const express = require("express");
const router = express.Router();
const { createProduct,createPlan, getProducts, getPlans, getPlanById, updateProductById, updatePlanById, activatePlan, deactivatePlan } = require("../controllers/subscriptions");

router.get('/get/products',getProducts);
router.get('/get/plans',getPlans);
router.get('/get/plans/:id',getPlanById);
router.post("/create/product",createProduct);
router.post("/create/plan",createPlan);
router.put("/update/product/:id",updateProductById);
router.put("/update/plan/:id",updatePlanById);
router.put("/update/plan/:id/activate",activatePlan);
router.put("/update/plan/:id/deactivate",deactivatePlan);
module.exports = router;