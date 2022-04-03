const express = require("express");
const router = express.Router();
const {
  watiWebhookController,
  // addWatiContacts,
} = require("../controllers/wati.controller");

router.post("/", watiWebhookController);
// router.get("/", addWatiContacts);
module.exports = router;