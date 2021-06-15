const express = require('express');
const {
	getMessagesByEmail, getAdmins,
} = require('../controllers/AdMessages.controller');
const router = express.Router();
router.get("/query/admins/:queryBy",getAdmins );
router.get('/:email', getMessagesByEmail);

module.exports = router;
