const mongoose = require("mongoose");

const Customer = new mongoose.Schema(
  {
    id: Number,
    firstName: String,
    lastName: String,
    email: String,
    whatsAppnumber: String,
    phone: String,
    meetingLink: String,
    classId: String,
    categoryId: String,
    age: Number,
    timeZoneId: String,
    numberOfStudents: Number,
    customerId: String,
    scheduleDescription: String,
    countryId: String,
    placeOfStay: String,
    classStatusId: String,
    proposedAmount: Number,
    proposedCurrencyId: String,
    welcomeCall: Boolean,
    welcomeChat: Boolean,
    welcomeEmail: Boolean,
    studyMaterialSent: Boolean,
    agentId: String,
    oneToOne: Boolean,
    teacherId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", Customer);
