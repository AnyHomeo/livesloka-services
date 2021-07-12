const Transactions = require("../models/Transactions");
const momentTZ = require("moment-timezone");

function getDaysInMonth(month, year) {
  var date = new Date(year, month, 1);
  var days = [];
  while (date.getMonth() === month) {
    days.push(momentTZ(date).format("YYYY-MM-DD"));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

exports.getTransactionsData = async (req, res) => {
  const { month } = req.query;
  //2021-02 format month
  let splittedMonth = parseInt(month.split("-")[1]);
  let splittedYear = parseInt(month.split("-")[0]);
  let startOfMonth = momentTZ(month, "YYYY-MM")
    .tz("Asia/Kolkata")
    .startOf("month")
    .format();
  let endOfMonth = momentTZ(month, "YYYY-MM")
    .tz("Asia/Kolkata")
    .endOf("month")
    .format();
  let allTransactionsOftheMonth = await Transactions.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  }).sort({ date: 1 });
  let allDates = getDaysInMonth(splittedMonth - 1, splittedYear);
  allTransactionsOftheMonth = allTransactionsOftheMonth.reduce((prev, next) => {
    let key = momentTZ(next["date"]).format("YYYY-MM-DD");
    if (!prev[key]) {
      prev[key] = [];
    }
    prev[key].push(next);
    return prev;
  }, {});
  let dateWiseAmount = allDates.map(
    (date) =>
      allTransactionsOftheMonth[date]
        .map((transaction) => transaction.amount)
        .reduce((a, b) => a + b,0));
  return res.json({
    allDates,
    dateWiseAmount,
    totalAmount:dateWiseAmount.reduce((a, b) => (parseFloat(a) + parseFloat(b)),0).toFixed(2)
  });
};
