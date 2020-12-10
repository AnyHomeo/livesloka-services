var express = require("express");
var router = express.Router();

var ctrl = require("../controllers/admin.controller");
var customerCtrl = require("../controllers/Customer.controller");

router.post("/login", ctrl.authentication);
router.post("/ChangePassword", ctrl.ChangePassword);
router.post("/register", ctrl.register);

router.post("/customer/registerCustomer", customerCtrl.registerCustomer);
router.get("/customer/details", customerCtrl.details);
router.get("/customer/data", customerCtrl.getRespectiveDetails);
router.post("/customer/updateCustomer", customerCtrl.updateCustomer);
router.get("/customer/delete/:customerId", customerCtrl.deleteCustomer);

//invoice
router.post("/admin/addinvoice", ctrl.addinvoice);
router.post("/admin/getinvoices", ctrl.getinvoices);
router.post("/admin/deleteinvoice", ctrl.deleteInvoice);

//Getting all Feilds
router.get("/admin/get/:name", ctrl.getCorrespondingData);

//add all fields
router.post("/admin/add/:name", ctrl.addField);

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

//password reset
router.get("/admin/reset/:id", ctrl.resetPassword);
router.get("/all/admins", ctrl.getAllAdmins);

module.exports = router;
