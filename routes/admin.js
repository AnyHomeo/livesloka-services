require("dotenv").config()
var express = require("express");
var router = express.Router();
var twilio = require('twilio');
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);
var ctrl = require("../controllers/admin.controller");
var customerCtrl = require("../controllers/Customer.controller");
const { addOtpToAdminCollection, validateOtpAndResetPassword,getAddress,postAddress } = require("../controllers/admin.controller");

router.get('/address/:id',getAddress);
router.post('/address/:id',postAddress);

/**
 *@swagger
 * tags:
 *   name: Login
 *   description: Apis to Login user
 */

 /**
 *@swagger
 * tags:
 *   name: Customer Data
 *   description: Apis to Manage Customer Data
 */

  /**
 *@swagger
 * tags:
 *   name: Add Fields
 *   description: Apis to Manage Add Fields
 */

/**
 * @swagger
 *  /login:
 *  post: 
 *   summary: Login a User
 *   tags: [Login]
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       properties:
 *        userId:
 *         type: string
 *         example: ram
 *        password:
 *         type: string
 *         example: ram
 *       required:
 *        - userId
 *        - password                     
 *   responses:
 *    200:
 *     description: Login Successful
 *    400:
 *     description: Invalid UserId or Password
 *    500:
 *     description: Something went wrong!
 */

router.post("/login", ctrl.authentication);

/**
 * @swagger
 *  /ChangePassword:
 *  post: 
 *   summary: Change Password of Loggedin User
 *   tags: [Login]
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       properties:
 *        userId:
 *         type: string
 *         example: ram
 *        newPassword:
 *         type: string
 *         example: ram
 *        confirmPassword:
 *         type: string
 *         example: ram
 *       required:
 *        - userId
 *        - password                     
 *   responses:
 *    200:
 *     description: Login Successful
 *    400:
 *     description: Invalid UserId or Password
 *    500:
 *     description: Something went wrong!
 */
router.post("/ChangePassword", ctrl.ChangePassword);
router.get("/otp/:number",(req,res) => {
    const { number } = req.params
	let otp = Math.floor(Math.random()*10000)
    client.messages.create({
        body: `Live Sloka:Your OTP for Registration is ${otp}`,
        to: number,  // Text this number
        from: process.env.TWILIO_NUMBER // From a valid Twilio number
    })
    .then((message) => {
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

/**
 * @swagger
 *  /customer/registerCustomer:
 *  post:
 *   tags: [Customer Data]
 *   summary: Add a New Customer
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       properties:
 *        firstName:
 *         type: string
 *         example: Customer Name
 *        lastName:
 *         type: string
 *         example: Parent Name
 *        email:
 *         type: string
 *         example: Parent@gmail.com
 *        whatsAppnumber:
 *         type: string
 *         example: +919493454298
 *        phone:
 *         type: string
 *         example: +919493454298
 *        age:
 *         type: number
 *         example: 5
 *        gender:
 *         type: string
 *         example: male
 *        subjectId:
 *         type: string
 *         example: 12212221221232
 *        timeZoneId:
 *         type: string
 *         example: 44554455544554
 *        numberOfStudents:
 *         type: number
 *         example: 1
 *        countryId:
 *         type: string
 *         example: 55666556665
 *        proposedAmount:
 *         type: number
 *         example: 50       
 *   responses:
 *    200:
 *     description: Customer Inserted SuccessfulLy
 *    500:
 *     description: Something went wrong!
 */

router.post("/customer/registerCustomer", customerCtrl.registerCustomer);

/**
 * @swagger
 *  /customer/details:
 *  get: 
 *   summary: get all Customers data
 *   tags: [Customer Data]
 *   responses:
 *    200:
 *     description: Retrieved All Customers Successfully
 *    500:
 *     description: Something went wrong!
 */

router.get("/customer/details", customerCtrl.details);
/**
 * @swagger
 *  /customer/details:
 *  get: 
 *   summary: get all login users data
 *   tags: [Attendance]
 *   responses:
 *    200:
 *     description: Retrieved All Logins Successfully
 *    500:
 *     description: Something went wrong!
 */

router.get("/customer/data", customerCtrl.getRespectiveDetails);


/**
 * @swagger
 *  /customer/updateCustomer:
 *  post:
 *   tags: [Customer Data]
 *   summary: update a existing Customer (send which fields are edited)
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       properties:
 *        firstName:
 *         type: string
 *         example: Customer Name
 *        lastName:
 *         type: string
 *         example: Parent Name
 *        email:
 *         type: string
 *         example: Parent@gmail.com
 *        whatsAppnumber:
 *         type: string
 *         example: +919493454298
 *        phone:
 *         type: string
 *         example: +919493454298
 *        age:
 *         type: number
 *         example: 5
 *        gender:
 *         type: string
 *         example: male
 *        subjectId:
 *         type: string
 *         example: 12212221221232
 *        timeZoneId:
 *         type: string
 *         example: 44554455544554
 *        numberOfStudents:
 *         type: number
 *         example: 1
 *        countryId:
 *         type: string
 *         example: 55666556665
 *        proposedAmount:
 *         type: number
 *         example: 50       
 *   responses:
 *    200:
 *     description: Customer Updated SuccessfulLy
 *    500:
 *     description: Something went wrong!
 */

router.post("/customer/updateCustomer", customerCtrl.updateCustomer);

/**
 * @swagger
 *  /customer/delete/{customerId}:
 *  get:
 *   parameters:
 *    - in: path
 *      name: customerId
 *   summary: delete a customer
 *   tags: [Customer Data]
 *   responses:
 *    200:
 *     description: Deleted the specified customer Successfully
 *    500:
 *     description: Something went wrong!
 */

router.get("/customer/delete/:customerId", customerCtrl.deleteCustomer);

//invoice
router.post("/admin/addinvoice", ctrl.addinvoice);
router.post("/admin/getinvoices", ctrl.getinvoices);
router.post("/admin/deleteinvoice", ctrl.deleteInvoice);



/**
 * @swagger
 *  /admin/get/{name}:
 *  get:
 *   parameters:
 *    - in: path
 *      name: name
 *      schema:
 *       type: string
 *       enum: [Agent, ClassStatuses, Country, Currency, Status, Subject, ZoomAccount]
 *   summary: get all Respective Data
 *   tags: [Add Fields]
 *   responses:
 *    200:
 *     description: Retrieved All Data Successfully
 *    500:
 *     description: Something went wrong!
 */


//Getting all Feilds
router.get("/admin/get/:name", ctrl.getCorrespondingData);

//add all fields
router.post("/admin/add/:name", ctrl.addField);

//Updating Every Fields
router.post("/admin/update/status", ctrl.updateStatus);
router.post("/admin/update/:name", ctrl.updateCorrespondingData);

/**
 * @swagger
 *  /admin/delete/{name}/{id}:
 *  get:
 *   parameters:
 *    - in: path
 *      name: name
 *      schema:
 *       type: string
 *       enum: [Agent, ClassStatuses, Country, Currency, Status, Subject, ZoomAccount]
 *   summary: Delete an Item
 *   tags: [Add Fields]
 *   responses:
 *    200:
 *     description: Deleted Item Successfully
 *    500:
 *     description: Something went wrong!
 */
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


router.post("/forgot-password",addOtpToAdminCollection);
router.post("/user/password-reset",validateOtpAndResetPassword);
module.exports = router;
