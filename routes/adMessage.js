const express = require('express');
const {
	getMessagesByEmail, getAdmins,getMessages, addAcknowledgedCustomer, markAllAsReadByTeacher
} = require('../controllers/AdMessages.controller');
const router = express.Router();

router.get('/', getMessages);
router.get("/query/admins/:queryBy",getAdmins );
router.get('/:email', getMessagesByEmail);
router.post('/acknowledge',addAcknowledgedCustomer);
router.post('/teacher/mark/read',markAllAsReadByTeacher);
module.exports = router;
