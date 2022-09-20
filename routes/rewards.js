const express = require('express');
const router = express.Router();

const {
  getRewardsHistoryByUser,
  redeemRewards,
  addRewards,
} = require('../controllers/rewards.controller');

router.get('/user/:userId', getRewardsHistoryByUser);
router.post('/user', addRewards);
router.post('/', redeemRewards);

module.exports = router;
