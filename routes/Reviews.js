const express = require("express");
const router = express.Router();

const {
  createReview,
  getReview,
  deleteReview,
  updateReview,
} = require("../controllers/Reviews.controller");

router.post("/", createReview);
router.get("/:customerId/:scheduleId", getReview);
router.delete("/:_id", deleteReview);
router.patch("/:_id", updateReview);

module.exports = router;
