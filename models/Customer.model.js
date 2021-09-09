const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const Customer = new mongoose.Schema(
  {
    id: Number,
    firstName: {
      trim: true,
      type: String,
    },
    isJoinButtonEnabledByAdmin: {
      type: Boolean,
      default: false,
    },
    lastName: {
      trim: true,
      type: String,
    },
    paymentDate: {
      type: Number,
    },
    email: {
      trim: true,
      type: String,
      lowercase: true,
    },
    whatsAppnumber: {
      trim: true,
      type: String,
    },
    phone: {
      trim: true,
      type: String,
    },
    meetingLink: {
      trim: true,
      type: String,
    },
    classId: {
      trim: true,
      type: String,
    },
    className: {
      trim: true,
      type: String,
    },
    categoryId: {
      trim: true,
      type: String,
    },
    noOfClasses: {
      type: Number,
      default: 8,
    },
    age: Number,
    gender: {
      trim: true,
      type: String,
      enum: ["male", "female"]
    },
    subjectId: {
      trim: true,
      type: String,
    },
    timeZoneId: {
      trim: true, 
      type: String,
    },
    numberOfStudents: {
      type: Number,
      default: 1,
    },
    customerId: {
      trim: true,
      type: String,
    },
    scheduleDescription: {
      trim: true,
      type: String,
    },
    countryId: {
      trim: true,
      type: String,
    },
    placeOfStay: {
      trim: true,
      type: String,
    },
    classStatusId: {
      trim: true,
      type: String,
      default: "108731321313146850",
    },
    proposedAmount: {
      type: Number,
      default: 50,
    },
    proposedCurrencyId: {
      trim: true,
      type: String,
      default: "150762951045490",
    },
    welcomeCall: Boolean,
    welcomeChat: Boolean,
    welcomeEmail: Boolean,
    studyMaterialSent: Boolean,
    agentId: {
      trim: true,
      type: String,
    },
    oneToOne: Boolean,
    teacherId: {
      trim: true,
      type: String,
    },
    lastTimeJoined:{
      type:Date,
    },
    numberOfClassesBought: {
      type: Number,
      default: 0,
    },
    paidTill: {
      type: Date,
      trim: true,
    },
    isSummerCampStudent:{
      default:false,
      type:Boolean
    },
    tempScheduleId:{
      type:String
    },
    requestedSubjects:{
      type:Array
    },
    discount:{
      type:Number,
      default:0
    },
    autoDemo: {
      type: Boolean,
      default: false,
    },
    isNewCustomer: {
      type: Boolean,
      default: true,
    },
    stripeId: {
      type:String,
      default:true
    }
  },

  {
    timestamps: true,
  }
);

Customer.virtual("subject", {
  ref: "Subject",
  localField: "subjectId",
  foreignField: "id",
  justOne: true,
});

Customer.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Customer", Customer);