const CustomerModel = require("../models/Customer.model");
const AdminModel = require("../models/Admin.model");

module.exports = {
  async registerCustomer(req, res) {
    let customerRegData = new CustomerModel(req.body);

    customerRegData
      .save()
      .then((val) => {
        console.log(val);
        let user = new AdminModel({
          userId: req.body.email,
          customerId: val._id,
          username: req.body.firstName + " " + req.body.lastName,
          roleId: 1,
          password: "default123",
        });
        user
          .save()
          .then((newUser) => {
            return res.status(200).send({
              status: "OK",
              message:
                "Customer data inserted and Login Credentials created Successfully",
              result: null,
            });
          })
          .catch((err) => {
            return res.status(500).json({
              status: "Internal Server Error",
              error: "Error in creating Username and Password",
              result: null,
            });
          });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({
          status: "Bad Request",
          message: "Invalid Syntax",
          result: null,
        });
      });
  },

  async details(req, res) {
    console.log(req.body);
    CustomerModel.find({})
      .select(" -customerId ")
      .then((result) => {
        res
          .status(200)
          .json({ message: "Customer data retrieved", status: "OK", result });
      })
      .catch((err) => {
        res.status(400).json({ message: "something went Wrong", err });
      });
  },

  async updateCustomer(req, res) {
    console.log(req.body);
    CustomerModel.update({ _id: req.body._id }, req.body)
      .then((result) => {
        res.status(200).send({
          status: "OK",
          message: "Customer data updated Successfully",
          result: null,
        });
      })
      .catch((err) => {
        res.sendStatus(500);
        console.log(err);
      });
  },
};
