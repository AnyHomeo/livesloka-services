const mongoose = require("mongoose");

var ExpensesSchema = new mongoose.Schema(
  {
    id:{
      type:String
    },
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