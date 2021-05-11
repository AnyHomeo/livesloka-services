const SchedulerModel = require('../models/Scheduler.model');
const CustomerModel = require('../models/Customer.model');
const AdminModel = require('../models/Admin.model');
const TeacherModel = require('../models/Teacher.model');
const PaymentModel = require('../models/Payments')
const CurrencyModel = require('../models/Currency.model')
require("dotenv").config();
const paypal = require("paypal-rest-sdk");
const ClassHistoryModel = require('../models/ClassHistory.model');
var twilio = require('twilio');
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);


paypal.configure({
	mode: process.env.PAYPAL_MODE,
	client_id: process.env.PAYPAL_CLIENT_ID,
	client_secret: process.env.PAYPAL_CLIENT_SECRET,
  });

const getPaymentLink = (amount,title,currency,customerId,res) => {
	const payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${process.env.SERVICES_URL}/summercamps/payment/success/${customerId}`,
          cancel_url: `${process.env.SERVICES_URL}/summercamps/payment/cancel/${customerId}`,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: title || "Livesloka class",
                  price:amount.toString(),
                  currency: currency || "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: currency || "USD",
              total: amount.toString(),
            },
            description:
              "Payment for Summer camp " + title || "of Livesloka",
          },
        ],
      }
	  paypal.payment.create(payment_json, (error, payment) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
			  error:"Error in creating Payment!"
		  })
        } else {
			 let url = payment.links.filter(link => link.rel === "approval_url")[0].href
			 return res.json({
				 message:"Payment link generated successfullyy!!",
				 url
			 })
        }
      });
}

exports.getSummerCampSchedules = async (req, res) => {
	try {
		let summerCampSchedules = await SchedulerModel.find({
			isSummerCampClass: true,
			isDeleted: false
		}).lean();
		let allTeachers = await TeacherModel.find().select("id TeacherName teacherImageLink TeacherDesc").lean()
		summerCampSchedules = summerCampSchedules.map(schedule =>({
			...schedule,
			teacher:allTeachers.filter(teacher => teacher.id === schedule.teacher)[0]
		}))
		return res.json({
			result: summerCampSchedules,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong!',
		});
	}
};

exports.registerCustomer = async (req,res) => {
	try {
		const { email,scheduleId } = req.body
		let alreadyExists = await CustomerModel.findOne({email,tempScheduleId:scheduleId});
		let schedule = await SchedulerModel.findById(scheduleId).populate("subject")
		req.body.subjectId = schedule.subject.id
		req.body.proposedAmount = schedule.summerCampAmount
		req.body.firstName = req.body.firstName + " " + schedule.subject.subjectName
		if(!alreadyExists){
			if(!req.body.firstName || !req.body.lastName){
				return res.status(500).json({
					error:"Please complete the registration!!"
				})
			}
			let newCustomer = new CustomerModel({...req.body,isSummerCampStudent:true,tempScheduleId:scheduleId});
			await newCustomer.save();
			let loginAlreadyExists = await AdminModel.findOne({email});
			if(!loginAlreadyExists){
				let newAdmin = new AdminModel({
					username: req.body.firstName,
					userId:email,
					password:req.body.password,
					roleId:1,
					firstTimeLogin:"N",
					customerId:newCustomer._id
				});
				await newAdmin.save()
			}
			return getPaymentLink(schedule.summerCampAmount,schedule.summerCampTitle,"USD",newCustomer._id,res)
		} else {
			let isPaymentDone = await PaymentModel.findOne({
				status:"SUCCESS",
				customerId:alreadyExists._id,
			})
			if(isPaymentDone){
				return res.json({
					status:"ALREADY PAID",
					message:"Payment Already done please login to join Classes"
				})
			} else {
				let currency = await CurrencyModel.findOne({id:alreadyExists.proposedCurrencyId})
				if(currency){
					currency = currency.currencyName
				}
				return getPaymentLink(alreadyExists.proposedAmount,schedule.summerCampTitle,currency,alreadyExists._id,res)
			}
		}

	} catch (error) {
		console.log(error)
		return res.status(500).json({
			error:"Something went wrong!!"
		})
	}
}

exports.onSummerCampSuccessfulPayment = async (req,res) => {
	try {
		const { customerId } = req.params;
		const { PayerID, paymentId } = req.query;
		const customer = await CustomerModel.findById(customerId).select(
			"firstName lastName whatsAppnumber className proposedAmount proposedCurrencyId numberOfClassesBought tempScheduleId"
		  );
		  const currency = await CurrencyModel.findOne({
			id: customer.proposedCurrencyId,
		  });
		  const execute_payment_json = {
			payer_id: PayerID,
			transactions: [
			  {
				amount: {
				  currency: currency.currencyName || "USD",
				  total: customer.proposedAmount.toString(),
				},
			  },
			],
		  };
		  paypal.payment.execute(paymentId, execute_payment_json, async (error,payment) =>{
			if (error) {
				console.log(error);
				return res.status(400).send(
				  "Error Validating Payment!",
				);
			  } else {
				let schedule = await SchedulerModel.findById(customer.tempScheduleId)
				schedule.students.push(customer._id);
				await schedule.save()
				customer.className = schedule.className
				customer.meetingLink = schedule.meetingLink
				customer.teacherId = schedule.teacher
				customer.classStatusId = "113975223750050"
				let newUpdate = new ClassHistoryModel({
					previousValue:customer.numberOfClassesBought || 0,
					nextValue: customer.numberOfClassesBought ? customer.numberOfClassesBought + schedule.summerCampClassNumberOfDays : schedule.summerCampClassNumberOfDays,
					comment:"Successful Payment!",
					customerId:customerId
				  })
				  await newUpdate.save()
				customer.numberOfClassesBought = customer.numberOfClassesBought ? customer.numberOfClassesBought + schedule.summerCampClassNumberOfDays : schedule.summerCampClassNumberOfDays 
				await customer.save()
				const newPayment = new PaymentModel({
					customerId,
					status: "SUCCESS",
					paymentData: payment,
				  });
				  newPayment
					.save()
					.then(async (data) => {
						await client.messages.create({
							body: `Live Sloka: Payment Successful!, ${data._id ?  "PaymentId: " + data._id : ""}. Your Slot for ${schedule.summerCampTitle} is booked.For any queries please reachout to info@livesloka.com`,
							to: customer.whatsAppnumber,
							from: process.env.TWILIO_NUMBER
						})
					  return res.redirect(
						`${process.env.USER_CLIENT_URL}/payment-success`
					  );
					})
					.catch((err) => {
						console.log(err)
					  return res.json({
						error: "Internal Server Error",
					  });
					});
			  }
		  })
	} catch (error) {
		console.log(error)
		return res.status(500).send(
			"Something went wrong!"
		)
	}
}

exports.onSummerCampFailurePayment = async (req,res) =>{
	try {
		const { customerId } = req.params;
		let customer = await CustomerModel.findById(customerId)
		const newPayment = new PaymentModel({
			customerId,
			status: "CANCELLED",
			paymentData: null,
		  });
		  newPayment
			.save()
			.then(async (data) => {
				await client.messages.create({
					body: `Your Payment Failed!, PaymentId: ${payment._id}. Please register Again or Contact us.`,
					to: customer.whatsAppnumber,
					from: '+17035961891'
				})
			  return res.redirect(`${process.env.USER_CLIENT_URL}/payment-failed`);
			})
			.catch((err) => {
			  console.log(err);
			  return res.send(
				"Internal server Error",
			  );
			});
	} catch (error) {
		console.log(error)
		return res.status(500).send(
			"Internal Server Error, Try again after Sometime or Contact Admin",
		  );
	}
}

exports.getSummerCampStudents = async (req,res) =>{
	try {
		let customers = await CustomerModel.find({
			isSummerCampStudent:true
		})
		return res.json({
			result:customers,
			message:"Customers retrieved successfully!"
		})
	} catch (error) {
		console.log(error)
		return res.status(500).json({
			error:"Something went wrong!!"
		})
	}
}