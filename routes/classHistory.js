const express = require("express");
const { updateClassesPaid, getHistoryById } = require("../controllers/classHistory.controller");
const router = express.Router();

router.put("/",updateClassesPaid);
router.get("/:email",getHistoryById);

module.exports = router;
