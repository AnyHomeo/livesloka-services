const express = require('express');
const router =express.Router();
const { getCustomers,getCustomerById } = require('../controllers/customers');
const { isLoggedId,isAdmin } = require('../controllers/helpers');

router.get('/',isLoggedId,isAdmin,getCustomers);
router.get('/:id',isLoggedId,isAdmin,getCustomerById);

module.exports = router;