const express = require("express");
const { updateClassesPaid } = require("../controllers/classHistory.controller");
const router = express.Router();

router.put("/",updateClassesPaid);

module.exports = router;
