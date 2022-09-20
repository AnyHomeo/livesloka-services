const express = require('express');
const router = express.Router();

const { getExpenses } = require('../controllers/expenses.controller');

router.get('/', getExpenses);

module.exports = router;
