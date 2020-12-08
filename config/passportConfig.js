const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");

const admin = require("../models/Admin.model");

passport.use(
  new localStrategy({ usernameField: "userId" }, (username, password, done) => {
    admin.findOne({ userId: username }, (err, user) => {
      console.log(user);
      if (err) return done(err);
      // unknown user
      else if (!user) return done(null, false, { message: "Invalid UserID" });
      // wrong password
      else if (!user.verifyPassword(password))
        return done(null, false, { message: "Wrong password." });
      // authentication succeeded
      else return done(null, user);
    });
  })
);
