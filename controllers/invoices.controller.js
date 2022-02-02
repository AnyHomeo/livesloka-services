const PaymentsModel = require("../models/Payments");
const momentTZ = require("moment-timezone");
const company = require("../config/company.json");
const InvoicesModel = require("../models/invoices.model");
const Transactions = require("../models/Transactions");
const exchangeRates = require("./exchange-rates.json");

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
    const allJanuaryPayments = await PaymentsModel.find({
      createdAt: {
        $gte: momentTZ().subtract(1, "month").startOf("month").format(),
        $lte: momentTZ().subtract(1, "month").endOf("month").format(),
      },
      status: "SUCCESS",
    })
      .populate("customerId", "numberOfStudents whatsAppnumber lastName")
      .lean();

    let data = allJanuaryPayments.reduce((acc, payment) => {
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
      let newInvoice = new InvoicesModel(invoice);
      await newInvoice.save();
    }

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
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
      .set("year", year);
    const endDate = startDate.clone().endOf("month");
    console.log(startDate, endDate);
    let invoices = await InvoicesModel.find({
      paymentDate: {
        $gte: startDate.format(),
        $lte: endDate.format(),
      },
    }).lean();

    invoices = invoices.map((invoice) => {
      let exchangeRateIndex = exchangeRates.findIndex((rate) => {
        return (
          momentTZ(invoice.paymentDate)
            .tz("Asia/Kolkata")
            .format("DD/MM/YYYY") === rate.date
        );
      });
      let exchangeRate = 71.452;
      if (exchangeRateIndex !== -1) {
        exchangeRate = exchangeRates[exchangeRateIndex].amount;
      }
      let transactionFee = (invoice.transactionFee ?? 0)
      let net = invoice.taxableValue - transactionFee;
      let turnover = net * exchangeRate;
      let feeInInr = transactionFee * exchangeRate * -1
      let recieved = net * transactionFee
      return {
        ...invoice,
        exchangeRate: exchangeRate.amount,
        net,
        turnover,
        feeInInr,
        recieved
      };
    });

    return res.json({ result: invoices });
  } catch (error) {
    console.log(error);
  }
};
