const express = require('express');
const router = express.Router();

const {
  sendOtpsForSalarysFinalisation,
} = require('../controllers/agents.controller');

router.post('/send-otps/salary-verification', sendOtpsForSalarysFinalisation);

module.exports = router;
