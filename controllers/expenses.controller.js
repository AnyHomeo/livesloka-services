const ExpensesModel = require('../models/expenses.model');
const momentTZ = require('moment-timezone');

exports.getExpenses = async (req, res) => {
  try {
    const { month } = req.query;
    let date = momentTZ(month, 'YYYY-MM').tz('Asia/Kolkata');
    console.log(date);
    let expensesOfTheMonth = await ExpensesModel.find({
      date: {
        $gte: date.startOf('month').format(),
        $lte: date.endOf('month').format(),
      },
    })
      .sort({ date: -1 })
      .lean();

    return res.json({
      result: expensesOfTheMonth,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
    });
  }
};
