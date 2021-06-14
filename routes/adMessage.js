const express = require('express');
const {
	getMessagesByEmail,
} = require('../controllers/AdMessages.controller');
const router = express.Router();

router.get('/:email', getMessagesByEmail);

module.exports = router;
