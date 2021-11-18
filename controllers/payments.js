require("dotenv").config();
const momentTZ = require("moment-timezone");
const Plans = require("../models/Plan.model");
const paypal = require("paypal-rest-sdk");
const Razorpay = require("razorpay");
const Customer = require("../models/Customer.model");
const Payment = require("../models/Payments");
const Currency = require("../models/Currency.model");
const TimeZoneModel = require("../models/timeZone.model");
const OptionsModel = require("../models/SlotOptions"); 
const shortid = require("shortid")
const moment = require("moment");
const {
  isFutureDate,
  getNameFromTimezone,
  sendSMS,
  sendAdminsMessage,
} = require("../config/helper");
const { scheduleAndupdateCustomer } = require("./subscriptions");
const SubjectModel = require("../models/Subject.model");
const TeacherModel = require("../models/Teacher.model");
const OptionModel = require("../models/SlotOptions");
const {
  SUCCESSFUL_SUBSCRIPTION,
  ADMIN_PAYMENT_SUCCESSFUL,
} = require("../config/messages");

paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getPayableAmount = (plan,discount,customer) => ((plan.amount - ((discount?.amount || 0)*plan.intervalCount))*(customer?.numberOfStudents || 1))

exports.createAPayment = async (req, res) => {
  try {
    const { planId, customerId } = req.params;
    const customer = await Customer.findById(customerId)
      .select("firstName discount numberOfStudents isSubscription")
      .lean();
      let planConfig = {
        _id: planId,
        isSubscription: !!customer.isSubscription,
      }
    const plan = await Plans.findOne(planConfig)
      .populate("currency")
      .lean();

    if (!customer) {
      return res.status(400).json({ error: "Invalid Customer" });
    }
    
    if (!plan) {
      return res.status(400).json({ error: "Invalid Plan" });
    }

    const option = await OptionsModel.findOne({
      customer,
    })
    const discount = option.discounts.filter(discount =>  discount.plan.equals(plan._id))[0]
    let amount = getPayableAmount(plan,discount,customer) 
    if (plan.currency.currencyName !== "INR") {
      const payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${process.env.SERVICES_URL}/payments/paypal/${planId}/${customerId}/success`,
          cancel_url: `${process.env.SERVICES_URL}/payments/paypal/${planId}/${customerId}/cancel`,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: plan.name,
                  price: amount.toString(),
                  currency: plan.currency.currencyName || "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: plan.currency.currencyName || "USD",
              total: amount.toString(),
            },
            description: plan.description,
          },
        ],
      };
      paypal.payment.create(payment_json, function (error, payment) {
        if (error) {
          console.log(error);
          res.status(500).json({
            error:
              "error in creating payment, Try again after Sometime or Contact Admin",
          });
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              return res.json({
                link: payment.links[i].href,
                type: "PAYPAL",
              });
            }
          }
        }
      });
    } else {
      console.log(amount)
      const options = {
        amount: amount*100,
        currency: "INR",
        receipt: shortid.generate(),
        payment_capture: 1,
      };
      let response = await razorpay.orders.create(options);
      return res.json({
        amount: response.amount,
        currency: response.currency,
        id: response.id,
        type: "RAZORPAY",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error, Try again after Sometime or Contact Admin",
    });
  }
};

exports.handlePaypalCancelledPayment = async (req, res) => {
  try {
    const { planId, customerId } = req.params;
    const newPayment = new Payment({
      customerId,
      plan: planId,
      status: "CANCELLED",
      paymentData: null,
    });
    newPayment
      .save()
      .then(() => {
        return res.redirect(`${process.env.USER_CLIENT_URL}/payment-failed`);
      })
      .catch((err) => {
        console.log(err);
        return res.json({
          error: "Internal server Error",
        });
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error, Try again after Sometime or Contact Admin",
    });
  }
};

exports.handlePaypalSuccessfulPayment = async (req, res) => {
  try {
    const { planId, customerId } = req.params;
    const { PayerID, paymentId } = req.query;
    const customer = await Customer.findById(customerId);
    const currency = await Currency.findOne({
      id: customer.proposedCurrencyId,
    });
    let timeZone = await TimeZoneModel.findOne({
      id: customer.timeZoneId || "141139634553016",
    });
    const plan = await Plans.findById(planId).lean();
    const subject = await SubjectModel.findOne({ id: customer.subjectId });

    const option = await OptionModel.findOne({
      customer: customerId,
    }).lean();

    const discount = option.discounts.filter(discount =>  discount.plan.equals(plan._id))[0]
    let amount = getPayableAmount(plan,discount,customer)

    const execute_payment_json = {
      payer_id: PayerID,
      transactions: [
        {
          amount: {
            currency: currency.currencyName || "USD",
            total: amount.toString(),
          },
        },
      ],
    };
    console.log(execute_payment_json)

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      async function (error, payment) {
        if (error) {
          console.log(error);
          return res.status(400).json({
            error: "Something went wrong!",
          });
        } else {
          let nextDate;
          if (customer.paidTill && isFutureDate(customer.paidTill)) {
            nextDate = moment(customer.paidTill)
              .add(plan.interval + "s", plan.intervalCount)
              .format();
          } else {
            nextDate = moment()
              .add(plan.interval + "s", plan.intervalCount)
              .format();
          }
          const newPayment = new Payment({
            customerId,
            status: "SUCCESS",
            paymentData: payment,
          });
          await newPayment.save();

          //message to admin and customer
          const zone =
            getNameFromTimezone(timeZone.timeZoneName) || "Asia/Kolkata";
          let customerMessage = SUCCESSFUL_SUBSCRIPTION(
            amount,
            currency.currencyName || "USD",
            subject.subjectName,
            momentTZ(nextDate).tz(zone).format("MMM Do YYYY")
          );
          sendSMS(
            customerMessage,
            `${customer.countryCode}${customer.whatsAppnumber}`.trim()
          );
          let adminMessage = ADMIN_PAYMENT_SUCCESSFUL(
            amount,
            currency.currencyName || "USD",
            subject.subjectName,
            customer.firstName,
            momentTZ(nextDate).tz("Asia/Kolkata").format("MMM Do YYYY")
          );
          sendAdminsMessage(adminMessage);

          if (option) {
            const teacher = await TeacherModel.findOne({ id: option.teacher });
            return await scheduleAndupdateCustomer(
              nextDate,
              customer,
              teacher,
              subject,
              option,
              res,
              true
            );
          } else {
            return res.redirect(
              `${process.env.USER_CLIENT_URL}/payment-success`
            );
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

exports.handleSuccessfulRazorpayPayment = async (req, res) => {
  try {
    const { planId, customerId } = req.params;
    const customer = await Customer.findById(customerId);
    const currency = await Currency.findOne({
      id: customer.proposedCurrencyId,
    });
    let timeZone = await TimeZoneModel.findOne({
      id: customer.timeZoneId || "141139634553016",
    });
    const plan = await Plans.findById(planId).lean();
    const subject = await SubjectModel.findOne({ id: customer.subjectId });

    const option = await OptionModel.findOne({
      customer: customerId,
    }).lean();

    let nextDate;
    if (customer.paidTill && isFutureDate(customer.paidTill)) {
      nextDate = moment(customer.paidTill)
        .add(plan.interval + "s", plan.intervalCount)
        .format();
    } else {
      nextDate = moment()
        .add(plan.interval + "s", plan.intervalCount)
        .format();
    }
    const discount = option.discounts.filter(discount =>  discount.plan.equals(plan._id))[0]
    let amount = getPayableAmount(plan,discount,customer)

    //message to admin and customer
    const zone = getNameFromTimezone(timeZone.timeZoneName) || "Asia/Kolkata";
    let customerMessage = SUCCESSFUL_SUBSCRIPTION(
      amount,
      currency.currencyName || "USD",
      subject.subjectName,
      momentTZ(nextDate).tz(zone).format("MMM Do YYYY")
    );
    sendSMS(
      customerMessage,
      `${customer.countryCode}${customer.whatsAppnumber}`.trim()
    );
    let adminMessage = ADMIN_PAYMENT_SUCCESSFUL(
      amount,
      currency.currencyName || "USD",
      subject.subjectName,
      customer.firstName,
      momentTZ(nextDate).tz("Asia/Kolkata").format("MMM Do YYYY")
    );
    sendAdminsMessage(adminMessage);
    if (option) {
      const teacher = await TeacherModel.findOne({ id: option.teacher });
      return await scheduleAndupdateCustomer(
        nextDate,
        customer,
        teacher,
        subject,
        option,
        res,
        true
      );
    } else {
      return res.redirect(`${process.env.USER_CLIENT_URL}/payment-success`);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};