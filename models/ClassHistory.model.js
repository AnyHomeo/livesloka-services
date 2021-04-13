const mongoose = require("mongoose");

var ClassHistorySchema = new mongoose.Schema(
  {
    comment:{
        type: String,
        trim:true,
    },
    previousValue:{
        type:Number
    },
    nextValue:{
        type:Number
    },
    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        trim: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassHistory", ClassHistorySchema);
