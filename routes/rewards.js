const express = require("express");
const router = express.Router();

const {
    getRewardsHistoryByUser, redeemRewards
} = require("../controllers/rewards.controller");

router.get("/user/:userId", getRewardsHistoryByUser);
router.post("/",redeemRewards)

module.exports = router;