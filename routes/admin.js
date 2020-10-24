var express = require('express');
var router = express.Router();

var ctrl = require('../controllers/admin.controller')
var customerCtrl = require('../controllers/Customer.controller')

/* GET home page. */



router.post('/login', ctrl.authentication);

router.post('/PasswordConfirm', ctrl.PasswordConfirm);
router.post('/ChangePassword', ctrl.ChangePassword);

router.post('/register', ctrl.register);

router.post("/customer/registerCustomer", customerCtrl.registerCustomer);
router.get("/customer/details", customerCtrl.details);
router.post("/customer/updateCustomer", customerCtrl.updateCustomer);


//Posting all kinds of data
router.post('/admin/addclass', ctrl.addClass)
router.post('/admin/addtimezone', ctrl.addtimezone)
// router.post('/admin/addclassstatus', ctrl.addclassstatus)
router.post("/admin/addcurrency", ctrl.addcurrency)
router.post("/admin/addcountry", ctrl.addcountry)
router.post("/admin/addstatus", ctrl.addStatus)

//Getting all Feilds
router.get('/admin/get/:name', ctrl.getCorrespondingData)

//Updating Every Fields
router.post("/admin/update/:name", ctrl.updateCorrespondingData)

//deleting Every Fields
router.post("/admin/delete/:name/:id", ctrl.DeleteCorrespondingData)

module.exports = router;
