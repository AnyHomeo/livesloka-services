const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var adminSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  userId: {
    type: String,
  },
  roleId: {
    type: Number,
  },
  firstTimeLogin: {
    type: String,
    default: "Y",
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  password: {
    type: String,
    required: "Password can't be empty",
    minlength: [4, "Password must be atleast 4 character long"],
  },
});

// Methods
adminSchema.methods.verifyPassword = function (password) {
  console.log(password);
  console.log(this.password);
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
