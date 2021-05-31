require('dotenv').config();
const paypal = require('paypal-rest-sdk');
const Customer = require('../models/Customer.model');
const Payment = require('../models/Payments');
const Currency = require('../models/Currency.model');
const ClassHistoryModel = require('../models/ClassHistory.model');
const { addMonths } = require('../scripts');
const moment = require('moment');
const shortid = require('shortid');
const Razorpay = require('razorpay');

paypal.configure({
	mode: process.env.PAYPAL_MODE,
	client_id: process.env.PAYPAL_CLIENT_ID,
	client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.makePayment = async (req, res) => {
	try {
		const { id } = req.body;
		const user = await Customer.findById(id).select(
			'firstName lastName className proposedAmount proposedCurrencyId'
		);
		const currency = await Currency.findOne({ id: user.proposedCurrencyId });
		if (currency.currencyName !== 'INR') {
			if (user.proposedAmount) {
				let price = user.proposedAmount.toString();
				const payment_json = {
					intent: 'sale',
					payer: {
						payment_method: 'paypal',
					},
					redirect_urls: {
						return_url: `${process.env.SERVICES_URL}/payment/success/${id}`,
						cancel_url: `${process.env.SERVICES_URL}/payment/cancel/${id}`,
					},
					transactions: [
						{
							item_list: {
								items: [
									{
										name: user.className || 'Livesloka class',
										price,
										currency: currency.currencyName || 'USD',
										quantity: 1,
									},
								],
							},
							amount: {
								currency: currency.currencyName || 'USD',
								total: price,
							},
							description: 'Payment for Class: ' + (user.className || 'Livesloka class'),
						},
					],
				};
				paypal.payment.create(payment_json, function (error, payment) {
					if (error) {
						console.log(error);
						res.status(500).json({
							error: 'error in creating payment, Try again after Sometime or Contact Admin',
						});
					} else {
						for (let i = 0; i < payment.links.length; i++) {
							if (payment.links[i].rel === 'approval_url') {
								return res.json({
									link: payment.links[i].href,
									type: 'PAYPAL',
								});
							}
						}
					}
				});
			} else {
				return res.status(500).json({
					error: 'Please Contact Admin! to add Amount or Currency',
				});
			}
		} else {
			const options = {
				amount: user.proposedAmount * 100,
				currency: 'INR',
				receipt: shortid.generate(),
				payment_capture: 1,
			};
			let response = await razorpay.orders.create(options);
			return res.json({
				amount: response.amount,
				currency: response.currency,
				id: response.id,
				type: 'RAZORPAY',
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Internal Server Error, Try again after Sometime or Contact Admin',
		});
	}
};

exports.onSuccess = async (req, res) => {
	try {
		const { id } = req.params;
		const { PayerID, paymentId } = req.query;
		let previousValue = 0;
		let nextValue = 0;
		const customer = await Customer.findById(id).select(
			'firstName lastName className proposedAmount proposedCurrencyId noOfClasses paymentDate numberOfClassesBought paidTill'
		);
		const currency = await Currency.findOne({
			id: customer.proposedCurrencyId,
		});
		const execute_payment_json = {
			payer_id: PayerID,
			transactions: [
				{
					amount: {
						currency: currency.currencyName || 'USD',
						total: customer.proposedAmount.toString(),
					},
				},
			],
		};

		paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
			if (error) {
				console.log(error);
				return res.status(400).json({
					error: 'Something went wrong!',
				});
			} else {
				if (customer.noOfClasses != 0 && !!customer.noOfClasses) {
					previousValue = customer.numberOfClassesBought;
					customer.numberOfClassesBought = customer.numberOfClassesBought + customer.noOfClasses;
					nextValue = customer.numberOfClassesBought;
					let newUpdate = new ClassHistoryModel({
						previousValue,
						nextValue,
						comment: 'Successful Payment!',
						customerId: id,
					});
					await newUpdate.save();
				} else if (customer.paymentDate) {
					if (customer.paidTill) {
						customer.paidTill = addMonths(customer.paidTill, 1);
					} else {
						const year = new Date().getFullYear();
						const month = new Date().getMonth() + 1;
						customer.paidTill = addMonths(`${customer.paymentDate}-${month}-${year}`, 1);
					}
				}
				customer.classStatusId = '113975223750050';
				await customer.save();
				const newPayment = new Payment({
					customerId: id,
					status: 'SUCCESS',
					paymentData: payment,
				});
				newPayment
					.save()
					.then(async (data) => {
						return res.redirect(`${process.env.USER_CLIENT_URL}/payment-success`);
					})
					.catch((err) => {
						return res.json({
							error: 'Internal Server Error',
						});
					});
			}
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Internal Server Error',
		});
	}
};

exports.onRazorpaySuccess = async (req, res) => {
	try {
		let previousValue = 0;
		let nextValue = 0;
		const { id } = req.params;
		const customer = await Customer.findById(id).select(
			'firstName lastName classStatusId className proposedAmount proposedCurrencyId noOfClasses paymentDate numberOfClassesBought paidTill'
		);
		previousValue = customer.numberOfClassesBought;
		if (customer.noOfClasses != 0 && !!customer.noOfClasses) {
			customer.numberOfClassesBought = customer.numberOfClassesBought + customer.noOfClasses;
			nextValue = customer.numberOfClassesBought;
			let newUpdate = new ClassHistoryModel({
				previousValue,
				nextValue,
				comment: 'Successful Payment from Razorpay!',
				customerId: id,
			});
			await newUpdate.save();
		} else if (customer.paymentDate) {
			if (customer.paidTill) {
				customer.paidTill = addMonths(customer.paidTill, 1);
			} else {
				const year = new Date().getFullYear();
				const month = new Date().getMonth() + 1;
				customer.paidTill = addMonths(`${customer.paymentDate}-${month}-${year}`, 1);
			}
		}

		customer.classStatusId = '113975223750050';
		await customer.save();
		return res.json({
			message: 'Added classses Successfully',
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Internal Server Error',
		});
	}
};

exports.onFailurePayment = async (req, res) => {
	try {
		const { id } = req.params;
		const newPayment = new Payment({
			customerId: id,
			status: 'CANCELLED',
			paymentData: null,
		});
		newPayment
			.save()
			.then((data) => {
				return res.redirect(`${process.env.USER_CLIENT_URL}/payment-failed`);
			})
			.catch((err) => {
				console.log(err);
				return res.json({
					error: 'Internal server Error',
				});
			});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Internal Server Error, Try again after Sometime or Contact Admin',
		});
	}
};

exports.getTransactions = async (req, res) => {
	const id = req.params.id;
	try {
		const userEmail = await Customer.findOne({ _id: id }).select('email');
		const allUsers = await Customer.find({
			email: userEmail.email,
		});
		let allUserIds = allUsers.map((user) => user._id);
		const allTransactions = await Payment.find({
			customerId: {
				$in: allUserIds,
			},
		}).populate('customerId').sort({createdAt:-1});

		if (allTransactions === null) {
			return res.status(400).json({
				error: 'Not found',
			});
		} else {
			return res.status(200).json({
				message: 'Retrived successfully',
				result: allTransactions,
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: 'Something went wrong',
		});
	}
};

exports.getAllTransactions = async (req, res) => {
	try {
		const allTransactions = await Payment.find().populate('customerId').sort({ createdAt: -1 });

		if (allTransactions === null) {
			return res.status(400).json({
				message: 'Not found',
			});
		} else
			return res.status(200).json({
				message: 'Retrived successfully',
				result: allTransactions,
			});
	} catch (error) {
		console.log(error);
	}
};

exports.getDailyDataGraph = async (req, res) => {
	try {
		const data = await Payment.find().sort({ createdAt: 1 }).populate('customerId');
		let dailyData = {};
		let monthlyData = {};

		data &&
			data.forEach((val) => {
				if (val.paymentData !== null && val.type === "PAYPAL") {
					const date = moment(val.paymentData.create_time).format('MMMM D YYYY');
					dailyData[date] = dailyData[date] || {
						responses: [],
						totalAmount: [],
						totalSum: [],
						dates: [],
					};

					// dailyData[date].responses.push(val);
					dailyData[date].totalAmount.push(Math.floor(val.paymentData.transactions[0].amount.total));
					dailyData[date].dates.push(moment(val.paymentData.create_time).format('MMMM D YYYY'));
					dailyData[date].totalSum = dailyData[date].totalAmount.reduce(function (a, b) {
						return a + b;
					}, 0);

					dailyData[date].dates = dailyData[date].dates.filter(function (item, index, inputArray) {
						return inputArray.indexOf(item) == index;
					});
				}
			});

		data &&
			data.forEach((item) => {
				let month = moment(item.createdAt).format('MMMM YYYY');
				monthlyData[month] = monthlyData[month] || { count: 0, responses: [] };
				monthlyData[month].count++;
				monthlyData[month].responses.push(item);
			});
		return res.status(200).json({
			result: dailyData,
		});
	} catch (error) {
		console.log(error);
	}
};

exports.validateRazorpayWebhook = async (req, res, next) => {
	try {
		let signature = req.headers['x-razorpay-signature'];
		let isValid = Razorpay.validateWebhookSignature(
			JSON.stringify(req.body),
			signature,
			process.env.RAZORPAY_SECRET
		);
		if (isValid) {
			return next();
		}
		return res.json({
			status: 'SUCCESS',
		});
	} catch (error) {
		console.log(error);
		return res.json({ status: 'SUCCESS' });
	}
};

exports.razorpayWebhook = async (req, res) => {
	try {
		let { event } = req.body;
		let id = req.body.payload.payment.entity.notes[0];
		let payment = req.body;
		const newPayment = new Payment({
			customerId: id,
			status: event === 'payment.captured' ? 'SUCCESS' : 'CANCELLED',
			paymentData: payment,
			type: 'RAZORPAY',
		});
		await newPayment.save();
		return res.json({
			status: 'SUCCESS',
		});
	} catch (error) {
		console.log(error);
		return res.send({ status: 'SUCCESS' });
	}
};
