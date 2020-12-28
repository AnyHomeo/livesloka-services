const CustomerModel = require("../models/Customer.model");
const AdminModel = require("../models/Admin.model");
const AttendanceModel = require("../models/Attendance");
const SubjectsModel = require("../models/Subject.model");
const ScheduleModel = require("../models/Scheduler.model");
const PaymentModel = require("../models/Payments");

module.exports = {
  async registerCustomer(req, res) {
    let customerRegData = new CustomerModel(req.body);
    customerRegData
      .save()
      .then(async (val) => {
        let user = {};
        try {
          const data = await AdminModel.findOne({ userId: val.email });
          if (data) {
            return res.json({
              status: "OK",
              message: "Customer added, Use old credentials to login",
              result: val,
            });
          } else {
            if (req.body.firstName && req.body.lastName) {
              user.username = req.body.firstName + " " + req.body.lastName;
            } else if (req.body.firstName) {
              user.username = req.body.firstName;
            } else if (req.body.lastName) {
              user.username = req.body.lastName;
            } else if (req.body.email) {
              user.username = req.body.email.split("@")[0];
            } else {
              user.username =
                "Livesloka User " + Math.floor(Math.random() * 1000000 + 1);
            }
            if (req.body.email) {
              user.userId = req.body.email;
            } else if (req.body.phone) {
              user.userId = req.body.phone;
            } else {
              user.userId =
                "Livesloka" + Math.floor(Math.random() * 1000000 + 1);
            }
            user.roleId = 1;
            user.customerId = val._id;
            user.password = "livesloka";
            let newUserdata = new AdminModel(user);
            newUserdata
              .save()
              .then((newUser) => {
                return res.status(200).send({
                  status: "OK",
                  message:
                    "Customer data inserted and Login Credentials created Successfully",
                  result: val,
                });
              })
              .catch((err) => {
                return res.status(500).json({
                  status: "Internal Server Error",
                  error: "Error in creating Username and Password",
                  result: null,
                });
              });
          }
        } catch (error) {}
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
    CustomerModel.find({})
      .select(" -customerId ")
      .sort({ createdAt: -1 })
      .then((result) => {
        res.status(200).json({
          message: "Customer data retrieved",
          status: "OK",
          result,
        });
      })
      .catch((err) => {
        res.status(400).json({ message: "something went Wrong", err });
      });
  },

  async updateCustomer(req, res) {
    CustomerModel.updateOne({ _id: req.body._id }, req.body)
      .then((result) => {
        if (req.body.email) {
          AdminModel.updateOne(
            { customerId: req.body._id },
            { userId: req.body.email }
          )
            .then((updatedUser) => {
              return res.status(200).send({
                status: "OK",
                message: "Customer data updated Successfully",
                result: null,
              });
            })
            .catch((err) => {
              console.log(err);
              return res
                .status(500)
                .json({ error: "error in updating userid" });
            });
        } else {
          res.status(200).send({
            status: "OK",
            message: "Customer data updated Successfully",
            result: null,
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: "something went wrong",
        });
        console.log(err);
      });
  },

  getRespectiveDetails: async (req, res) => {
    let { params } = req.query;
    params = params.split(",").join(" ");
    AdminModel.find({})
      .select(params)
      .then((users) => {
        return res
          .status(200)
          .json({ message: "retrieved all users", result: users });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ error: "unable to retrieve users", result: null });
      });
  },

  deleteCustomer: async (req, res) => {
    const { customerId } = req.params;
    CustomerModel.findByIdAndDelete(customerId, (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "error in Deleting customer", result: null });
      }
      AdminModel.findOneAndDelete({ customerId }, (err, docs) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "error in Deleting customer", result: null });
        }
        return res
          .status(200)
          .json({ message: "Customer Deleted Successfully" });
      });
    });
  },

  getCustomerData: (req, res) => {
    const { customerId } = req.params;
    let { params } = req.query;
    if (params) {
      params = params.split(",").join(" ");
      CustomerModel.findById(customerId)
        .select(params)
        .then((docs) => {
          return res.status(200).json({
            message: "data retrieved successfully",
            result: docs,
          });
        })
        .catch((err) =>
          res.status(500).json({
            error: "Internal Server Error",
            result: null,
          })
        );
    } else {
      return res
        .status(400)
        .json({ error: "Please provide Params", result: null });
    }
  },

  getCustomersAllData: async (req, res) => {
    try {
      let { params } = req.query;
      const subjects = await SubjectsModel.find().select("subjectName id");
      params = params.split(",").join(" ");
      CustomerModel.find()
        .select(params)
        .lean()
        .then((data) => {
          data = data.map((customer) => {
            if (customer.subjectId) {
              return {
                ...customer,
                subject: subjects.filter(
                  (subject) => subject.id == customer.subjectId
                )[0],
              };
            } else {
              return customer;
            }
          });
          return res.status(200).json({
            message: "retrieved students successfully",
            result: data,
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({
            message: "Error in retrieving data",
          });
        });
    } catch (error) {}
  },

  getAllSchedulesByMail: async (req, res) => {
    try {
      const { email } = req.body;
      let customers = await CustomerModel.find({ email })
        .select("_id scheduleDescription noOfClasses paymentDate")
        .lean();
      let customerIds = customers.map((customer) => customer._id);
      let schedules = await ScheduleModel.find({
        isDeleted: { $ne: true },
        students: { $in: customerIds },
      });

      let mainSchedules = await Promise.all(
        customers.map(async (customer) => {
          let schedule = await ScheduleModel.findOne({
            isDeleted: { $ne: true },
            students: { $in: [customer._id] },
          }).lean();
          let latestPayment = await PaymentModel.findOne({
            status: "SUCCESS",
            customerId: customer._id,
          }).sort({ createdAt: -1 });
          if (latestPayment) {
            let attendance = await AttendanceModel.countDocuments({
              _id: {
                $gt: latestPayment._id,
              },
              scheduleId: schedule._id,
            }).sort({ createdAt: -1 });
            if (!customer.noOfClasses == "0" || !!customer.noOfClasses) {
              return {
                ...schedule,
                customerId: customer._id,
                isPaymentButtonEnabled:
                  attendance >= parseInt(customer.noOfClasses),
              };
            } else if (customer.paymentDate) {
              let parsedLatestPaymentDate = Date.parse(
                latestPayment.createdAt.toString()
              );
              let year = new Date().getFullYear();
              let month = new Date().getMonth();
              let dateThisMonth = new Date(
                year,
                month,
                parseInt(customer.paymentDate)
              ).getTime();
              return {
                ...schedule,
                customerId: customer._id,
                isPaymentButtonEnabled: dateThisMonth > parsedLatestPaymentDate,
              };
            }
          } else {
            return {
              ...schedule,
              customerId: customer._id,
              isPaymentButtonEnabled: true,
            };
          }
        })
      );

      return res.json({
        result: mainSchedules,
      });
    } catch (error) {
      console.log(error);
      return res.json({
        error: "Error in retrieving the data",
      });
    }
  },

  getRequestedData: async (req, res) => {
    try {
      let { email, q } = req.query;
      q = q.split(",").join(" ");
      const customers = await CustomerModel.find({ email }).select(q);
      return res.json({
        message: "Data retrieved sucessfully",
        result: customers,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Internal Server error",
      });
    }
  },
};
