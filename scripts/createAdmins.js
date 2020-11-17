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

const createUsers = () => {
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

    const users = ["ram"];
    users.forEach((user) => {
      let newAdmin = new AdminModel({
        userId: user,
        username: user,
        roleId: 3,
        password: user,
      });
      newAdmin
        .save()
        .then((data) => {
          console.log("userId and password created for", user);
        })
        .catch((err) => {
          console.log(err);
        });
    });

    rl.close();
  });
};

createUsers();
