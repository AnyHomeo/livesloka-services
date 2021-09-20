const express = require("express");
const router = express.Router();

const {
    getVideosByCategoryId
} = require("../controllers/videos");

router.get("/category/:id", getVideosByCategoryId);

module.exports = router;
