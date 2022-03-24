const PaymentsModel = require("../models/Payments");
const momentTZ = require("moment-timezone");
const company = require("../config/company.json");
const InvoicesModel = require("../models/invoices.model");
const Transactions = require("../models/Transactions");
const { toFixed } = require("../config/helper");
const forexEndpoint = "https://api.fastforex.io";
const fetch = require("node-fetch");
const ExchangeRatesModel = require("../models/ExchangeRates.model");

exports.getInvoicesByTransactionId = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transactions.findOne({
      id: transactionId,
    });

    let transactionDate = transaction?.date;
    if (transactionDate) {
      let invoices = await InvoicesModel.find({
        paymentDate: {
          $gte: momentTZ(transactionDate).utc().startOf("day").format(),
          $lte: momentTZ(transactionDate).utc().endOf("day").format(),
        },
        paymentMethod:
          transaction?.mode === "PAYPAL" ? "Paypal" : { $ne: "Paypal" },
      });
      return res.json({
        result: invoices,
      });
    } else {
      res.json({ result: true });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
};

exports.createAllInvoices = async (req, res) => {
  try {
    let date = momentTZ().tz("Asia/Kolkata").subtract(3, "month").startOf('month');
    const allPayments = await PaymentsModel.find({
      createdAt: {
        $gte: date.clone().format(),
        $lte: date.clone().add(1,'months').format(),
      },
      status: "SUCCESS",
    })
      .populate("customerId", "numberOfStudents whatsAppnumber lastName")
      .lean();

    const exchangeRates = await ExchangeRatesModel.find({
      date: {
        $gte: date.clone().format(),
        $lte: date.clone().add(1,'months').add(3,'days').format(),
      },
    }).lean();

    let data = allPayments.reduce((acc, payment) => {
      if (payment.status === "SUCCESS") {
        if (payment.type === "PAYPAL") {
          const {
            transactions,
            payer: {
              payer_info: {
                first_name,
                last_name,
                shipping_address: {
                  recipient_name,
                  line1,
                  city,
                  state,
                  postal_code,
                  country_code,
                },
              },
            },
          } = payment.paymentData;

          let depositExchangeRate = exchangeRates.filter(
            (exchangeRate) =>
              momentTZ(exchangeRate.date).utc().unix() ===
              momentTZ(payment.createdAt).utc().startOf("day").unix()
          )?.[0]?.rate;

          let exchangeRate = exchangeRates.filter(
            (exchangeRate) =>
              momentTZ(exchangeRate.date).utc().unix() ===
              momentTZ(payment.createdAt)
                .add(1, "day")
                .utc()
                .startOf("day")
                .unix()
          )?.[0]?.rate;

          console.log(payment.createdAt, exchangeRate, depositExchangeRate);

          acc.push({
            company,
            customer: {
              name: `${last_name} ${first_name}`,
              address: `${recipient_name}, ${line1}, ${city}, ${state} - ${postal_code}`,
              person: first_name,
              country: country_code,
              contact: payment?.customerId?.whatsAppnumber || "",
              state,
              stateCode: state,
            },
            items: [
              {
                description: transactions[0].description,
                quantity: payment?.customerId?.numberOfStudents || 1,
                amount: transactions[0]?.amount?.total,
              },
            ],

            taxableValue: transactions[0]?.amount?.total,
            transactionFee:
              transactions[0]?.related_resources[0]?.sale?.transaction_fee
                ?.value,
            cgst: 0,
            sgst: 0,
            paymentMethod: "Paypal",
            paymentDate: payment.createdAt,
            depositExchangeRate,
            exchangeRate,
          });
        } else {
          const {
            payload: {
              payment: {
                entity: { contact, amount, fee, method },
              },
            },
          } = payment.paymentData;
          acc.push({
            company,
            customer: {
              name: payment?.customerId?.lastName,
              address: "",
              person: payment?.customerId?.lastName,
              country: "",
              contact,
              state: "",
              stateCode: "",
            },
            items: [
              {
                description: `payment for Livesloka class`,
                quantity: payment?.customerId?.numberOfStudents || 1,
                amount: amount / 100,
              },
            ],

            taxableValue: amount / 100,
            transactionFee: fee / 100,
            cgst: 0,
            sgst: 0,
            paymentMethod: method,
            paymentDate: payment.createdAt,
          });
        }
      }
      return acc;
    }, []);

    for (let i = 0; i < data.length; i++) {
      const invoice = data[i];
      await createNewInvoice(invoice);
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error, message: error.message });
  }
};

const createNewInvoice = async (invoice) => {
  //  Livesloka international 2021-2022 December Invoice number
  // id --> "LSI/21-22/12/1";
  let paymentDate = momentTZ(invoice.paymentDate);
  let paymentsCount = await InvoicesModel.countDocuments({
    paymentDate: {
      $gte: paymentDate.startOf("month").format(),
      $lte: paymentDate.endOf("month").format(),
    },
  });
  paymentsCount = paymentsCount + 1;
  let presentYear = paymentDate.year().toString().slice(2);
  let previousYear = (paymentDate.year() - 1).toString().slice(2);
  invoice.id = `LSI/${previousYear}-${presentYear}/${
    paymentDate.month() + 1
  }/${paymentsCount}`;
  let newInvoice = new InvoicesModel(invoice);
  await newInvoice.save();
};

exports.getInvoices = async (req, res) => {
  try {
    let { month, year } = req.query;
    console.log(month, year);
    if (!month) return res.status(400).json({ message: "Month is required" });

    month = parseInt(month - 1);
    const startDate = momentTZ()
      .tz("Asia/Kolkata")
      .set("month", month)
      .set("year", year)
      .startOf("month");
    const endDate = startDate.clone().endOf("month");
    let invoices = await InvoicesModel.find({
      paymentDate: {
        $gte: startDate.format(),
        $lte: endDate.format(),
      },
    }).lean();

    invoices = invoices.map((invoice) => {
      if (invoice.paymentMethod === "Paypal") {
        let { depositExchangeRate, exchangeRate } = invoice;
        let transactionFee = toFixed(invoice.transactionFee ?? 0);
        let net = toFixed(invoice.taxableValue - transactionFee);
        let turnover = toFixed(invoice.taxableValue * exchangeRate);
        let feeInInr = toFixed(transactionFee * exchangeRate * -1);
        let recieved = toFixed(net * depositExchangeRate);
        let exchangeRateDifference = toFixed(
          exchangeRate - depositExchangeRate,
          5
        );
        return {
          ...invoice,
          exchangeRateDifference,
          net,
          turnover,
          feeInInr,
          recieved,
        };
      } else {
        return {
          ...invoice,
          exchangeRate: "NA",
          depositExchangeRate: "NA",
          exchangeRateDifference: "NA",
          net: toFixed(invoice.taxableValue),
          turnover: toFixed(invoice.taxableValue),
          feeInInr: toFixed(invoice.transactionFee),
          recieved: toFixed(
            invoice.taxableValue - (invoice.transactionFee ?? 0)
          ),
        };
      }
    });

    return res.json({ result: invoices });
  } catch (error) {
    console.log(error);
  }
};

exports.storeAllExhangeRates = async (req, res) => {
  try {
    let startDate = momentTZ("31-12-2021", "DD-MM-YYYY").utc();
    let endDate = momentTZ("01-01-2022", "DD-MM-YYYY").utc();
    let exchangeRates = [];
    while (startDate.unix() < endDate.unix()) {
      console.log(startDate.format("MMMM Do, YYYY"));

      let date = startDate.format("YYYY-MM-DD");
      let response = await fetch(
        `${forexEndpoint}/historical?api_key=${process.env.FAST_FOREX_KEY}&from=USD&to=INR&date=${date}`
      );
      response = await response.json();
      if (!response.error) {
        exchangeRates.push({
          from: "USD",
          to: "INR",
          id: momentTZ().unix() + parseInt(Math.random() * 10000000),
          date: date,
          rate: response.results["INR"],
        });
      }

      startDate.add(1, "day");
    }

    await ExchangeRatesModel.insertMany(exchangeRates);
    return res.json({ success: true, result: exchangeRates });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error, message: error.message });
  }
};
