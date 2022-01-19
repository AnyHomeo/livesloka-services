const mongoose = require("mongoose");

var AgentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    AgentDesc: {
      trim: true,
      type: String,
    },
    AgentName: {
      trim: true,
      type: String,
    },
    AgentStatus: {
      trim: true,
      type: String,
    },
    AgentLoginId:{
      trim:true,
      lowercase:true,
      type:String,
      default:""
    },
    AgentTimeZone:{
      type:String,
      trim:true,
      default:"IST",
      uppercase:true
    },
    AgentRole:{
      type:Number,
      default:3
    },
    phoneNumber:{
      type:String,
      default:""
    },
    needToFinalizeSalaries:{
      type:Boolean,
      default:false
    },
    role:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Roles",
      default:' '
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", AgentSchema);
