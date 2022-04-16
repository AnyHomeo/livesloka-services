const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  postNotificationToken,
  getCustomerDashboardData,
} = require("../controllers/customers");
const { isLoggedId, isAdmin } = require("../controllers/helpers");

router.get("/", isLoggedId, isAdmin, getCustomers);
router.post("/:userId/notification-token", postNotificationToken);
router.get("/dashboard", getCustomerDashboardData);
router.get("/:id", isLoggedId, isAdmin, getCustomerById);

module.exports = router;
