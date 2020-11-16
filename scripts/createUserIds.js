const mongoose = require("mongoose");
const AdminModel = require("../models/Admin.model");
const Customer = require("../models/Customer.model");
const readline = require("readline");
let problematicUsers = [];
var mongoUrl;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const createUsers = (next) => {
  rl.question("please enter mongodb url ", (answer) => {
    mongoUrl = answer;
    mongoose.connect(
      mongoUrl,
      { useUnifiedTopology: true, useNewUrlParser: true },
      (err) => {
        if (!err) {
          console.log("MongoDB connection succeeded.");
        } else {
          console.log(
            "Error in MongoDB connection : " + JSON.stringify(err, undefined, 2)
          );
        }
      }
    );

    Customer.find({}, (err, docs) => {
      docs.forEach((userData, i) => {
        let user = {};
        console.log(
          "creating user id for" +
            " " +
            userData.firstName +
            " " +
            userData.lastName +
            "......"
        );
        user.username = userData.firstName + " " + userData.lastName;
        if (userData.email) {
          user.userId = userData.email;
        } else if (userData.phone) {
          user.userId = userData.phone;
        } else {
          user.userId =
            userData.firstName +
            userData.lastName +
            Math.floor(Math.random() * 10000 + 1);
        }
        user.roleId = 1;
        user.customerId = userData._id;
        user.password = "livesloka";
        const newUser = new AdminModel(user);
        newUser
          .save()
          .then((data) => {
            console.log(
              " userid and password successfully created for " +
                userData.firstName +
                " " +
                userData.lastName
            );
            if (i === docs.length - 1) {
              next();
            }
          })
          .catch((err) => {
            problematicUsers.push(user);
            console.error(
              "error in creating userid and password for" +
                userData.firstName +
                " " +
                userData.lastName
            );
          });
      });
    });
    rl.close();
  });
};

createUsers(() => {
  console.log(problematicUsers);
});
