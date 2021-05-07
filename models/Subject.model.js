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
    amount: {
      type: Number,
      default:0
    },
    summerCampTitle:{
      type:String,
      default:""
    },
    summerCampDescription:{
      type:String,
      default:""
    },
    summerCampImageLink:{
      type:String,
      default:""
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Subject", SubjectSchema);
