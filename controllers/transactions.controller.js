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

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

exports.getTransactionsData = async (req, res) => {
  try {
    const { month } = req.query;
    //2021-02 format month
    let months = month.split(",")
    let output = {}
    await asyncForEach(months,async (month) => {
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
        allTransactionsOftheMonth[date] ? allTransactionsOftheMonth[date]
            .map((transaction) => transaction.amount)
            .reduce((a, b) => a + b,0) : 0);
      
      let extraArr = [...new Array(31 - dateWiseAmount.length)].map(_ => 0)
      output[month] = dateWiseAmount.concat(extraArr)
    })
    return res.json({
      result:output
    })    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error:"Something went wrong!"
    })
  }
    };
