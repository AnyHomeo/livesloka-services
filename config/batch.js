require("dotenv").config();
const cron = require("node-cron");
const fetch = require("node-fetch");
const Transactions = require("../models/Transactions");
const { URLSearchParams } = require("url");
const momentTZ = require("moment-timezone");

const savePaypalTransactions = async (transactions) => {
  try {
    if (transactions && Array.isArray(transactions) && transactions.length) {
      let transactionsToInsert = transactions.map((transaction) => {
        let {
          transaction_id: id,
          transaction_initiation_date: date,
          transaction_amount: { value: amount },
        } = transaction.transaction_info;
        return {
          id,
          amount: parseFloat(amount) * -1,
          mode: "PAYPAL",
          date: new Date(date),
        };
      });
      let data = await Transactions.insertMany(transactionsToInsert);
      console.log(
        `${data.length} Paypal Transactions Inserted Successfully!`
      );
    } else {
      console.log("No Paypal Transactions in this Cron job");
    }
  } catch (error) {
    console.log(error);
  }
};

const addRazorpayTransactions = async (transactions) => {
    if(Array.isArray(transactions)){
        transactions = transactions.reduce((transactionsArr,transaction) => {
            let { id, amount, status, created_at } = transaction;
            if (status === "captured") {
              transactionsArr.push({
                id,
                mode: "RAZORPAY",
                amount: amount / 100,
                date: new Date(created_at * 1000),
              });
            }
            return transactionsArr;
          },[]);
          if(transactions.length){
            let data = await Transactions.insertMany(transactions);
            console.log(
                `${data.length} Razorpay Transactions Inserted Successfully!`
              );
          } else {
              console.log("No new Razorpay Transactions in this Cron job");
          }
    } else {
        console.log("No new Razorpay Transactions in this Cron job");
    }
};

const fetchPaypalAndRazorpay = async () => {
  try {
    console.log("Started fetching paypal and Razorpay APIs....");
    let latestPaypalTransaction = await Transactions.findOne({
      mode: "PAYPAL",
    })
      .sort({ date: -1 })
      .lean();

    let latestRazorpayTransaction = await Transactions.findOne({
      mode: "RAZORPAY",
    })
      .sort({ date: -1 })
      .lean();

    const paypalTokenParams = new URLSearchParams();
    paypalTokenParams.append("grant_type", "client_credentials");
    fetch(`https://api-m.paypal.com/v1/oauth2/token`, {
      method: "POST",
      body: paypalTokenParams,
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
            "binary"
          ).toString("base64"),
      },
    })
      .then((res) => res.json())
      .then((json) => {
        let accessToken = json["access_token"];
        let paypalLatestDate = momentTZ(latestPaypalTransaction.date)
          .utc()
          .add(2, "seconds")
          .format();
        let timeRightNow = momentTZ().utc().format();
        fetch(
          `https://api-m.paypal.com/v1/reporting/transactions?start_date=${paypalLatestDate}&end_date=${timeRightNow}&transaction_type=T0400`,
          {
            method: "get",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
          .then((res) => res.json())
          .then((json) => {
            savePaypalTransactions(json.transaction_details);
          });
      })
      .catch((err) => {
        console.log(err);
      });
    let latestRazorpayTransactionUnix =
      momentTZ(latestRazorpayTransaction.date).unix() + 2;
    let timeRightNowUnix = momentTZ().unix();
    fetch(
      `https://api.razorpay.com/v1/payments?from=${latestRazorpayTransactionUnix}&to=${timeRightNowUnix}`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
              "binary"
            ).toString("base64"),
        },
      }
    )
      .then((res) => res.json())
      .then((json) => {
        addRazorpayTransactions(json.items);
      });
  } catch (error) {
    console.log(error);
  }
};

const batch = () => {
  if(process.env.ENVIRONMENT !== "DEV"){
    console.log("Scheduling Cron Batches....");
    cron.schedule("0 1 * * *", fetchPaypalAndRazorpay, {
      timezone: "Asia/Kolkata",
    });
  }
};

module.exports = batch;