const mongoose = require("mongoose");

var ExpensesSchema = new mongoose.Schema(
  {
    name:{
        type:String,
    },
    amount:{
        type: Number,
        default:0
    },
    description:{
        type: String,
    },
    date:{
        type: Date,
        default:Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expenses", ExpensesSchema);