const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const classModel = require("./classes.model");
const subjectModel = require("./Subject.model");
const categoryModel = require("./Category.model");
const classStatus = require("./ClassStatuses.model");
const teacherModel = require("./Teacher.model");

const Customer = new mongoose.Schema(
  {
    id: Number,
    firstName: {
      trim: true,
      type: String,
    },
    emailId:{
      type:String,
      default: function() { return this.email || ""} 
    },
    countryCode:{
      type:String,
      default:""
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
      enum: ["male", "female"],
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
    lastTimeJoined: {
      type: Date,
    },
    numberOfClassesBought: {
      type: Number,
      default: 0,
    },
    paidTill: {
      type: Date,
      trim: true,
    },
    isSummerCampStudent: {
      default: false,
      type: Boolean,
    },
    tempScheduleId: {
      type: String,
    },
    requestedSubjects: [{ type: String }],
    discount: {
      type: Number,
      default: 0,
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
      type: String,
      default: true,
    },
  },
  { timestamps: true }
);

Customer.virtual("subject", {
  ref: "Subject",
  localField: "subjectId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "subjectName _id",
  },
});

Customer.virtual("subjects", {
  ref: "Subject",
  localField: "requestedSubjects",
  foreignField: "id",
  options: {
    select: "subjectName _id",
  },
});

Customer.virtual("class", {
  ref: "Class",
  localField: "classId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "className _id",
  },
});

Customer.virtual("category", {
  ref: "Category",
  localField: "categoryId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "categoryName _id",
  },
});

Customer.virtual("timeZone", {
  ref: "timeZone",
  localField: "timeZoneId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "timeZoneName _id",
  },
});

Customer.virtual("classStatus", {
  ref: "ClassStatu",
  localField: "classStatusId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "classStatusName _id",
  },
});

Customer.virtual("currency", {
  ref: "Currency",
  localField: "proposedCurrencyId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "currencyName _id prefix",
  },
});

Customer.virtual("agent", {
  ref: "Agent",
  localField: "agentId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "AgentName _id",
  },
});

Customer.virtual("teacher", {
  ref: "Teacher",
  localField: "teacherId",
  foreignField: "id",
  justOne: true,
  options: {
    select: "TeacherName _id",
  },
});

Customer.virtual("login", {
  ref: "Admin",
  localField: "email",
  foreignField: "userId",
  justOne: true,
  options: {
    select: "rewards userId",
  },
});

Customer.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Customer", Customer);
