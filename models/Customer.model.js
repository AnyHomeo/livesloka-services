const mongoose = require("mongoose");

const Customer = new mongoose.Schema(
  {
    id: Number,
    firstName: {
      trim: true,
      type: String,
    },
    lastName: {
      trim: true,
      type: String,
    },
    isPaymentDone: {
      type: Boolean,
      default: false,
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
    noOfClasses: Number,
    age: Number,
    gender: {
      trim: true,
      type: String,
    },
    subjectId: {
      trim: true,
      type: String,
    },
    timeZoneId: {
      trim: true,
      type: String,
    },
    numberOfStudents: Number,
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
    },
    proposedAmount: Number,
    proposedCurrencyId: {
      trim: true,
      type: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", Customer);
