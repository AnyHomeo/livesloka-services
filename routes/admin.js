var express = require("express");
var router = express.Router();

var ctrl = require("../controllers/admin.controller");
var customerCtrl = require("../controllers/Customer.controller");

router.post("/login", ctrl.authentication);

// router.post("/PasswordConfirm", ctrl.PasswordConfirm);
router.post("/ChangePassword", ctrl.ChangePassword);

router.post("/register", ctrl.register);

router.post("/customer/registerCustomer", customerCtrl.registerCustomer);
router.get("/customer/details", customerCtrl.details);
router.get("/customer/data", customerCtrl.getRespectiveDetails);
router.post("/customer/updateCustomer", customerCtrl.updateCustomer);

//Posting all kinds of data
router.post("/admin/addclass", ctrl.addClass);
router.post("/admin/addtimezone", ctrl.addtimezone);
router.post("/admin/addclassstatus", ctrl.addclassstatus);
router.post("/admin/addcurrency", ctrl.addcurrency);
router.post("/admin/addcountry", ctrl.addcountry);
router.post("/admin/addstatus", ctrl.addStatus);
router.post("/admin/addTeacher", ctrl.addTeacher);
router.post("/admin/addAgent", ctrl.addAgent);

//invoice
router.post("/admin/addinvoice", ctrl.addinvoice);
router.post("/admin/getinvoices", ctrl.getinvoices);
router.post("/admin/deleteinvoice", ctrl.deleteInvoice);

//Getting all Feilds
router.get("/admin/get/:name", ctrl.getCorrespondingData);

//Updating Every Fields

router.post("/admin/update/status", ctrl.updateStatus);
router.post("/admin/update/:name", ctrl.updateCorrespondingData);

//deleting Every Fields
router.post("/admin/delete/:name/:id", ctrl.DeleteCorrespondingData);

//working with comments
router.post("/admin/addcomment", ctrl.addcomment);
router.get("/admin/comments/:id", ctrl.getComments);
router.post("/admin/updatecomment", ctrl.updatecomment);
router.post("/admin/deletecomment", ctrl.deletecomment);

module.exports = router;
