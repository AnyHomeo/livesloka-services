const express = require("express");
const router = express.Router();
const {
  createProduct,
  createPlan,
  getProducts,
  getPlans,
  getPlanById,
  updateProductById,
  updatePlanById,
  activatePlan,
  deactivatePlan,
  getPlansByCustomerId,
  subscribeCustomerToAPlan,
  createProductValidations,
  createPlanValidations,
  subscribeCustomerToAStripePlan
} = require("../controllers/subscriptions");

router.get('/subscribe/paypal/:customerId/:planId',subscribeCustomerToAPlan);
router.post('/subscribe/stripe/:customerId/:planId',subscribeCustomerToAStripePlan);
router.get("/get/products", getProducts);
router.get("/get/plans/:productId", getPlans);
router.get("/get/plans/:planId", getPlanById);
router.post("/create/product", createProductValidations, createProduct);
router.post("/create/plan",createPlanValidations ,createPlan);
router.put("/update/product/:productId", updateProductById);
router.put("/update/plan/:planId", updatePlanById);
router.put("/update/plan/:planId/activate", activatePlan);
router.put("/update/plan/:planId/deactivate", deactivatePlan);
router.get("/plans/:customerId", getPlansByCustomerId);
module.exports = router;
