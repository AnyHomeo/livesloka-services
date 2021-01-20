const mongoose = require("mongoose");

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
    numberOfClassesBought: {
      type: Number,
      default: 0,
    },
    paidTill: {
      type: String,
      trim: true,
    },
    materials: [
      {
        className: { type: String },
        materialSrc: { type: String },
        typeOfmaterial: { type: String },
        date: { type: Date, default: new Date() },
      },
    ],
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", Customer);
