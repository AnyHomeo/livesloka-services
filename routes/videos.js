const express = require("express");
const router = express.Router();

const {
    getVideosByCategoryId,
    getVideosByAssignedToId
} = require("../controllers/videos");

router.get("/category/:id", getVideosByCategoryId);
router.get("/customer/:userId", getVideosByAssignedToId);

module.exports = router;
