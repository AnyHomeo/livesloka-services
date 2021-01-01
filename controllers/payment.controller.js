const paypal = require("paypal-rest-sdk");
const Customer = require("../models/Customer.model");
const Payment = require("../models/Payments");
const Currency = require("../models/Currency.model");
const { addMonths } = require("../scripts");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AS5jSU8LKbjLHa4iSYkVeEO_YTdPAa7AibsO3KTPAO_8TYKR_MeDUmelMNaqnEN6LrJjs__N_eqpJWrr",
  client_secret:
    "ELUSBgoGk_DVV2lrEYCnvx8mS04ArLtXo9i8Rl0DLszWYvigOTddFFmw8umMsDOhyyeJDHkPF5z-_cEB",
});

exports.makePayment = async (req, res) => {
  try {
    const { id } = req.body;
    console.log(id);
    const user = await Customer.findById(id).select(
      "firstName lastName className proposedAmount proposedCurrencyId"
    );
    console.log(user.proposedCurrencyId);
    const currency = await Currency.findOne({ id: user.proposedCurrencyId });
    console.log(user);
    if (user.proposedAmount && currency) {
      let price = user.proposedAmount.toString();
      console.log(price);
      const payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
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
                  name: user.className || "Livesloka class",
                  price,
                  currency: currency.currencyName || "INR",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: currency.currencyName || "INR",
              total: price,
            },
            description:
              "Payment for Class: " + user.className || "Livesloka class",
          },
        ],
      };
      console.log(payment_json);
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
              });
            }
          }
        }
      });
    } else {
      return res.status(500).json({
        error: "Please Contact Admin! to add Amount or Currency type",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error, Try again after Sometime or Contact Admin",
    });
  }
};

exports.onSuccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { PayerID, paymentId } = req.query;
    const customer = await Customer.findById(id).select(
      "firstName lastName className proposedAmount proposedCurrencyId noOfClasses paymentDate numberOfClassesBought paidTill"
    );
    const currency = await Currency.findOne({
      id: customer.proposedCurrencyId,
    });
    const execute_payment_json = {
      payer_id: PayerID,
      transactions: [
        {
          amount: {
            currency: currency.currencyName || "INR",
            total: customer.proposedAmount.toString(),
          },
        },
      ],
    };

    paypal.payment.execute(paymentId, execute_payment_json, async function (
      error,
      payment
    ) {
      if (error) {
        console.log(error);
        return res.status(400).json({
          error: "Something went wrong!",
        });
      } else {
        console.log(customer.noOfClasses, customer.paymentDate);
        if (customer.noOfClasses != 0 && !!customer.noOfClasses) {
          customer.numberOfClassesBought =
            customer.numberOfClassesBought + customer.noOfClasses;
        } else if (customer.paymentDate) {
          if (customer.paidTill) {
            customer.paidTill = addMonths(customer.paidTill, 1);
          } else {
            const year = new Date().getFullYear();
            const month = new Date().getMonth() + 1;
            console.log(`${customer.paymentDate}-${month}-${year}`);
            customer.paidTill = addMonths(
              `${customer.paymentDate}-${month}-${year}`,
              1
            );
          }
        }
        await customer.save();
        const newPayment = new Payment({
          customerId: id,
          status: "SUCCESS",
          paymentData: payment,
        });
        newPayment
          .save()
          .then(async (data) => {
            return res.redirect(
              `${process.env.USER_CLIENT_URL}/payment-success`
            );
          })
          .catch((err) => {
            return res.json({
              error: "Internal Server Error",
            });
          });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

exports.onFailurePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const newPayment = new Payment({
      customerId: id,
      status: "CANCELLED",
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
