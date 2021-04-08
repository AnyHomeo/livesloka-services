const express = require("express");
const { CancelAClass, updateCancelledClass, deleteCancelledClass, getAllAppliedLeaves } = require("../controllers/cancelledClasses.controller");
const router = express.Router();

router.get("/",getAllAppliedLeaves);
router.post("/",CancelAClass);
router.put("/",updateCancelledClass);
router.delete("/:id",deleteCancelledClass);

module.exports = router;