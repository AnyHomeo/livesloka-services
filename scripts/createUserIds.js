const mongoose = require('mongoose');
const AdminModel = require('../models/Admin.model');
const Customer = require('../models/Customer.model');
const readline = require('readline');
let problematicUsers = [];
var mongoUrl;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const createUsers = (next) => {
  rl.question('please enter mongodb url ', (answer) => {
    mongoUrl = answer;
    mongoose.connect(
      mongoUrl,
      { useUnifiedTopology: true, useNewUrlParser: true },
      (err) => {
        if (!err) {
          console.log('MongoDB connection succeeded.');
        } else {
          console.log(
            'Error in MongoDB connection : ' + JSON.stringify(err, undefined, 2)
          );
        }
      }
    );

    AdminModel.collection
      .drop()
      .then((val) => {
        Customer.find({}, (err, docs) => {
          docs.forEach((userData, i) => {
            let user = {};
            if (userData.firstName && userData.lastName) {
              user.username = userData.firstName + ' ' + userData.lastName;
            } else if (userData.firstName) {
              user.username = userData.firstName;
            } else if (userData.lastName) {
              user.username = userData.lastName;
            } else if (userData.email) {
              user.username = userData.email.split('@')[0];
            } else {
              user.username =
                'Livesloka User ' + Math.floor(Math.random() * 1000000 + 1);
            }
            console.log('creating userId and password for', user.username);
            if (userData.email) {
              user.userId = userData.email;
            } else if (userData.phone) {
              user.userId = userData.phone;
            } else {
              user.userId =
                'Livesloka' + Math.floor(Math.random() * 1000000 + 1);
            }
            user.roleId = 1;
            user.customerId = userData._id;
            user.password = 'livesloka';
            const newUser = new AdminModel(user);
            newUser
              .save()
              .then((data) => {
                console.log(
                  ' userid and password successfully created for ' +
                    user.username
                );
                if (i === docs.length - 1) {
                  next();
                }
              })
              .catch((err) => {
                problematicUsers.push(user);
                console.error(
                  'error in creating userid and password for' + user.username
                );
              });
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });

    rl.close();
  });
};

createUsers(() => {
  console.log(problematicUsers);
});
