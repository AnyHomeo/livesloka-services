const express = require("express");
const { CancelAClass, updateCancelledClass, deleteCancelledClass } = require("../controllers/cancelledClasses.controller");
const router = express.Router();

router.post("/",CancelAClass);
router.put("/",updateCancelledClass);
router.delete("/:id",deleteCancelledClass);

module.exports = router;