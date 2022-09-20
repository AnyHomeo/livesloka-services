const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const readline = require('readline');
var mongoUrl;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const makeAttendanceUnique = () => {
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
    Attendance.find()
      .sort({ _id: -1 })
      .limit(200)
      .exec()
      .then(async (data) => {
        data.forEach(async (item) => {
          let uniqueCustomers = [];
          let uniqueAbsentees = [];
          item.customers.forEach((customer) => {
            if (
              !uniqueCustomers.some((uniqueCustomer) =>
                customer.equals(uniqueCustomer)
              )
            ) {
              uniqueCustomers.push(customer);
            }
          });
          item.absentees.forEach((customer) => {
            if (
              !uniqueAbsentees.some((uniqueCustomer) =>
                customer.equals(uniqueCustomer)
              )
            ) {
              uniqueAbsentees.push(customer);
            }
          });
          item.customers = uniqueCustomers;
          item.absentees = uniqueAbsentees;
          console.log(item.customers);
          await item.save();
        });
      })
      .catch((err) => {
        console.log(err);
      });
    rl.close();
  });
};

makeAttendanceUnique();
