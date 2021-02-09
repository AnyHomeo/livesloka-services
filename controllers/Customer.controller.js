const CustomerModel = require("../models/Customer.model");
const AdminModel = require("../models/Admin.model");
const AttendanceModel = require("../models/Attendance");
const SubjectsModel = require("../models/Subject.model");
const ScheduleModel = require("../models/Scheduler.model");
const PaymentModel = require("../models/Payments");
const TimeZoneModel = require("../models/timeZone.model");
const moment = require("moment");
const SubjectModel = require("../models/Subject.model");

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
        } catch (error) {
          console.log(error);
        }
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
      .select("-customerId")
      .sort({ createdAt: -1 })
      .then((result) => {
        res.status(200).json({
          message: "Customer data retrieved",
          status: "OK",
          result,
        });
      })
      .catch((err) => {
        console.log(err);
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
        .select(
          "_id scheduleDescription noOfClasses paymentDate paidTill numberOfClassesBought isJoinButtonEnabledByAdmin"
        )
        .lean();
      let mainSchedules = await Promise.all(
        customers.map(async (customer) => {
          let isJoinButtonDisabled = true;
          if (customer.paidTill) {
            let dateArr = customer.paidTill.split("-").map((v) => parseInt(v));
            let dateToday = moment()
              .format("DD-MM-YYYY")
              .split("-")
              .map((v) => parseInt(v));
            isJoinButtonDisabled =
              (dateArr[2] > dateToday[2] &&
                dateArr[1] > dateToday[1] &&
                dateArr[0] > dateToday[0]) ||
              !customer.isJoinButtonEnabledByAdmin;
          } else {
            isJoinButtonDisabled = customer.numberOfClassesBought <= 0;
          }
          if (customer.isJoinButtonEnabledByAdmin) {
            isJoinButtonDisabled = false;
          }
          let actualSchedule = await ScheduleModel.findOne({
            students: { $in: [customer._id] },
            isDeleted: { $ne: true },
          }).lean();
          if (actualSchedule) {
            let subject = await SubjectModel.findOne({
              _id: actualSchedule.subject,
            });
            return {
              ...actualSchedule,
              isJoinButtonDisabled,
              customerId: customer._id,
              numberOfClassesBought: customer.numberOfClassesBought,
              paidTill: customer.paidTill,
              scheduleDescription: customer.scheduleDescription,
              subject,
            };
          } else {
            return null;
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

  insertDataFromWix: async (req, res) => {
    try {
      const { data } = req.body;
      console.log(data);
      data["field:comp-kh8kc6mf"] =
        typeof data["field:comp-kh8kc6mf"] === "string"
          ? data["field:comp-kh8kc6mf"].toUpperCase()
          : ".";
      let timeZoneSelected = await TimeZoneModel.findOne({
        timeZoneName: data["field:comp-kh8kc6mf"],
      }).lean();
      let selectedSubjectNames = data["field:comp-kh8nvj7n"]
        .split(",")
        .map((name) => name.trim());
      let selectedSubjects = await SubjectModel.find({
        subjectName: { $in: selectedSubjectNames },
      }).lean();
      let user = {
        lastName: data["field:comp-k8h6ltbn"],
        firstName: data["field:comp-kbj52w90"],
        timeZoneId: timeZoneSelected ? timeZoneSelected.id : "",
        whatsAppnumber: data["field:comp-kbfpi4zl"],
        email: data["field:comp-kcdgzuaj"],
        gender:
          typeof data["field:comp-kig8mhkn"] === "string"
            ? data["field:comp-kig8mhkn"].toLowerCase()
            : "",
        age: data["field:comp-kh8nsqzv"],
      };
      let finalUserInsertableData = selectedSubjects.map((subject) => {
        return {
          ...user,
          subjectId: subject.id,
          firstName: `${user.firstName} ${subject.subjectName}`,
        };
      });
      CustomerModel.insertMany(finalUserInsertableData, async (err, docs) => {
        if (err) {
          console.log(err);
        } else {
          const userIfExists = await AdminModel.findOne({
            userId: data["field:comp-kcdgzuaj"],
          });
          if (!userIfExists) {
            const newUser = new AdminModel({
              userId: data["field:comp-kcdgzuaj"],
              password: "livesloka",
              roleId: 1,
              customerId: docs[0]._id,
              username: data["field:comp-kbj52w90"],
            });
            newUser.save().then((savedDoc) => {
              return res.json({
                Success: true,
                message: "Login credentials created successfully",
              });
            });
          } else {
            return res.json({ Success: true });
          }
        }
      });
    } catch (error) {
      console.log(error);
      const { data } = req.body;
      let user = {
        lastName: data["field:comp-k8h6ltbn"],
        firstName: data["field:comp-kbj52w90"],
        whatsAppnumber: data["field:comp-kbfpi4zl"],
        email: data["field:comp-kcdgzuaj"],
        gender: data["field:comp-kig8mhkn"],
        age: data["field:comp-kh8nsqzv"],
      };
      const newCustomer = new CustomerModel(user);
      newCustomer
        .save()
        .then(async (data) => {
          const userIfExists = await AdminModel.findOne({
            userId: data["field:comp-kcdgzuaj"],
          });
          if (!userIfExists) {
            const newUser = new AdminModel({
              userId: data["field:comp-kcdgzuaj"],
              password: "livesloka",
              roleId: 1,
              customerId: docs[0]._id,
              username: data["field:comp-kbj52w90"],
            });
            newUser.save().then((savedDoc) => {
              return res.json({
                Success: true,
                message: "Login credentials created successfully",
              });
            });
          } else {
            return res.json({ Success: true });
          }
        })
        .catch((err) => {
          return res.status(500).json({
            error: "Error in Inserting Customers",
          });
        });
    }
  },
};
