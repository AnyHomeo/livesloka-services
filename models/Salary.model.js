const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var SalarySchema = new mongoose.Schema({
  TeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  paid: {
    type: Boolean,
    default: false,
  },
  salary: [
    {
      salary_amount: { type: String },
      for_month: { type: Date },
    },
  ],
});

module.exports = mongoose.model('salary', SalarySchema);
