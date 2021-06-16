const express = require('express');
const {
	getMessagesByEmail, getAdmins,getMessages
} = require('../controllers/AdMessages.controller');
const router = express.Router();

router.get('/', getMessages);
router.get("/query/admins/:queryBy",getAdmins );
router.get('/:email', getMessagesByEmail);

module.exports = router;
