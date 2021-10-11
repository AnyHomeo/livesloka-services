require("dotenv").config();
const cron = require("node-cron");
const fetch = require("node-fetch");
const Transactions = require("../models/Transactions");
const { URLSearchParams } = require("url");
const momentTZ = require("moment-timezone");
const TeacherLeavesModel = require("../models/TeacherLeaves.model");
const SchedulerModel = require("../models/Scheduler.model");
const times = require("../models/times.json");
const CancelledClassesModel = require("../models/CancelledClasses.model");
const AdminModel = require("../models/Admin.model");

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
      console.log(`${data.length} Paypal Transactions Inserted Successfully!`);
    } else {
      console.log("No Paypal Transactions in this Cron job");
    }
  } catch (error) {
    console.log(error);
  }
};

const addRazorpayTransactions = async (transactions) => {
  if (Array.isArray(transactions)) {
    transactions = transactions.reduce((transactionsArr, transaction) => {
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
    }, []);
    if (transactions.length) {
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

const getPresentSlot = () => {
  const nextSlot = momentTZ()
    .tz("Asia/Kolkata")
    .add(30, "minutes")
    .format("hh:mm A");
  const presentSlot = momentTZ()
    .tz("Asia/Kolkata")
    .format("dddd-hh:mm A")
    .toUpperCase();

  return `${presentSlot}-${nextSlot}`;
};

const getPrevSlot = (slot) => {
  let index = slot.search("-");
  let time = slot.slice(index + 1);
  let slotIndex = times.findIndex((singleTime) => singleTime === time);
  if (slotIndex !== -1) {
    return `${slot.split("-")[0]}-${times[slotIndex - 1]}`;
  } else {
    return slot;
  }
};

const addRewardsToCustomer = async () => {
  try {
    // let presentSlot = getPresentSlot();
    // let schedulesRightNow = await SchedulerModel.find({

    // })
    let presentSlot = getPresentSlot();
    let prevSlot = getPrevSlot(presentSlot);
    console.log(presentSlot, prevSlot);
    let day = presentSlot.split("-")[0].toLowerCase();
    let schedules = await SchedulerModel.find({
      ["slots." + day]: {
        $in: [presentSlot],
        $nin: [prevSlot],
      },
      isDeleted: false,
    }).lean();
    let scheduleIds = schedules.map((schedule) => schedule._id);
    if (scheduleIds.length) {
      let teacherLeaves = await TeacherLeavesModel.find({
        $or: [
          {
            scheduleId: {
              $in: scheduleIds,
            },
            date: {
              $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
              $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
            },
          },
          {
            entireDay: true,
            date: {
              $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
              $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
            },
          },
        ],
      })
        .populate("teacherId")
        .lean();
      let teachersOnLeaves = teacherLeaves.map(
        (teacher) => teacher.teacherId.id
      );

      if (teachersOnLeaves.length) {
        let customerLeaves = await CancelledClassesModel.find({
          cancelledDate: {
            $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
            $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
          },
          scheduleId: {
            $in: scheduleIds,
          },
        }).lean();

        let studentsOnLeaves = customerLeaves.map((leave) => leave.studentId);
        let allCustomersWithoutLeaves = schedules.reduce(
          (accumulator, schedule) => {
            if (teachersOnLeaves.includes(schedule.teacher)) {
              let customers = [...schedule.students];
              customers.forEach((customer) => {
                if (
                  !studentsOnLeaves.some((student) => student.equals(customer))
                ) {
                  accumulator.push(customer);
                }
              });
            }
          },
          []
        );

        if (allCustomersWithoutLeaves.length) {
          let customerEmails = await CustomerModel.find({
            _id: { $in: allCustomersWithoutLeaves },
          });
          customerEmails = customerEmails.map(customer => customer.email);
          await AdminModel.updateMany(
            { userId: { $in: customerEmails } },
            { $inc: { rewards: 1 } }
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const batch = () => {
  if (process.env.ENVIRONMENT !== "DEV") {
    console.log("Scheduling Cron Batches....");
    cron.schedule("0 1 * * *", fetchPaypalAndRazorpay, {
      timezone: "Asia/Kolkata",
    });

    cron.schedule("38 17 * * *", addRewardsToCustomer, {
      timezone: "Asia/Kolkata",
    });
  }
};

module.exports = batch;
