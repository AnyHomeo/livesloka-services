const mongoose = require("mongoose");

var SubjectSchema = new mongoose.Schema(
  {
    id: {
      trim: true,
      type: String,
    },
    subjectDesc: {
      trim: true,
      type: String,
    },
    subjectName: {
      trim: true,
      type: String,
    },
    description:{
      trim:true,
      type:String,
      default:""
    },
    amount: {
      type: Number,
      default:0
    },
    imageLink:{
      type:String,
      default:"",
      trim:true 
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Subject", SubjectSchema);
