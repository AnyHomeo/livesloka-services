const express = require('express');
const router = express.Router();

const { finalizeSalaries } = require('../controllers/finalizedSalaries');

router.post('/', finalizeSalaries);

module.exports = router;
