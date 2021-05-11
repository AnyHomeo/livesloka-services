require("dotenv").config()
var express = require("express");
var router = express.Router();
var twilio = require('twilio');
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);
var ctrl = require("../controllers/admin.controller");
var customerCtrl = require("../controllers/Customer.controller");

router.post("/login", ctrl.authentication);
router.post("/ChangePassword", ctrl.ChangePassword);
router.post("/register", ctrl.register);
router.get("/otp/:number",(req,res)=>{
    const { number } = req.params
	let otp = Math.floor(Math.random()*10000)
    client.messages.create({
        body: `Live Sloka:Your OTP for Registration is ${otp}`,
        to: number,  // Text this number
        from: process.env.TWILIO_NUMBER // From a valid Twilio number
    })
    .then((message) => {
        console.log(message)
        return res.json({
            message:"Otp sent!",
            result:otp+3456
        })
    }).catch(err =>{
        console.log(err)
        return res.status(500).json({
            error:"Something went wrong!!"
        })
    })
});

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

router.get("/admin/getSingleTeacher/:id", ctrl.getSingleTeacher)
module.exports = router;
