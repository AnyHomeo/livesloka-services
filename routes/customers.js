const express = require('express');
const router =express.Router();
const { getCustomers,getCustomerById,postNotificationToken } = require('../controllers/customers');
const { isLoggedId,isAdmin } = require('../controllers/helpers');

router.get('/',isLoggedId,isAdmin,getCustomers);
router.get('/:id',isLoggedId,isAdmin,getCustomerById);
router.post("/:userId/notification-token",postNotificationToken);

module.exports = router;