const express = require("express");
const router = express.Router();
const {
  watiWebhookController,
  getWatiMessages
  // addWatiContacts,
} = require("../controllers/wati.controller");

router.post("/", watiWebhookController);
// router.get("/", addWatiContacts);
router.get('/',getWatiMessages);

module.exports = router;