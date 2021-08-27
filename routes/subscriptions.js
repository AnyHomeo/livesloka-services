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
} = require("../controllers/subscriptions");

router.get('/subscribe/:customerId/:planId',subscribeCustomerToAPlan)
router.get("/get/products", getProducts);
router.get("/get/plans/:productId", getPlans);
router.get("/get/plans/:planId", getPlanById);
router.post("/create/product", createProduct);
router.post("/create/plan", createPlan);
router.put("/update/product/:productId", updateProductById);
router.put("/update/plan/:planId", updatePlanById);
router.put("/update/plan/:planId/activate", activatePlan);
router.put("/update/plan/:planId/deactivate", deactivatePlan);
router.get("/plans/:customerId", getPlansByCustomerId);
module.exports = router;