const mongoose = require("mongoose");

var FinalizedSalariesSchema = new mongoose.Schema(
  {
    month:{
        type:Number,
    },
    year:{
        type:Number,
    },
    otpsToValidate:[{
        agentId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent",
        },
        otp:{
            type:Number,
        }
    }],
    finalizedSalaries:{
        type:mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FinalizedSalaries", FinalizedSalariesSchema);
