const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    userId: {
      trim: true,
      type: String,
      lowercase: true,
      required: "email or userid is required",
    },
    roleId: {
      trim: true,
      type: Number,
      default: 1,
    },
    profilePic: {
      trim: true,
      type: String,
    },
    profileLocation: {
      trim: true,
      type: String,
      default: "null",
    },
    firstTimeLogin: {
      type: String,
      default: "Y",
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      trim: true,
    },
    teacherId: {
      type: String,
      trim: true,
    },
    agentId: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: "Password can't be empty",
      default: "livesloka",
      trim: true,
      minlength: [3, "Password must be atleast 4 character long"],
    },
    settings: mongoose.Schema.Types.Mixed,
    otp: Number,
  },
  { timestamps: true }
);

// Methods
adminSchema.methods.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

adminSchema.methods.generateJwt = function () {
  return jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
      imgUrl: this.imgUrl,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );
};

module.exports = mongoose.model("Admin", adminSchema);
