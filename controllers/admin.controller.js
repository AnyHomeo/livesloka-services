const jwt = require("jsonwebtoken");
const AdminModel = require("../models/Admin.model");
const { model } = require("../models/Admin.model");
const admin = require("../models/Admin.model");
const Comment = require("../models/comments.model");
const CustomerModel = require("../models/Customer.model");
const InvoiceModel = require("../models/Invoice.model");
const TimeZoneModel = require("../models/timeZone.model");

module.exports = {
  authentication(req, res, next) {
    try {
      admin.findOne(
        { userId: req.body.userId.toLowerCase()},
        async (err, user) => {
          console.log(err);
          if (!user) {
            return res
              .status(400)
              .json({ error: "Invalid userId or Password" });
          } else {
            if (user.password === req.body.password) {
              var payload = {
                _id: user._id,
                userId: user.userId,
              };
              var newToken = jwt.sign(
                payload,
                "mckdsmlckmweifjmc;mapofkmdskmvidonvcodkscklsdmcksdoisdsdmcks",
                {
                  expiresIn: process.env.JWT_EXP,
                }
              );
              user.password = undefined;
              let customer = await CustomerModel.findById(user.customerId)
                .select("timeZoneId firstName lastName phone whatsAppnumber -_id")
                .lean();
              if (customer) {
                let timeZone = await TimeZoneModel.findOne({
                  id: customer.timeZoneId,
                })
                  .select("timeZoneName -_id")
                  .lean();
                  if(timeZone){
                    return res.status(200).json({
                      message: "LoggedIn successfully",
                      result: {
                        ...user._doc,
                        ...customer,
                        timeZone: timeZone.timeZoneName,
                        token: newToken,
                      },
                    });
                  } else {
                    return res.status(200).json({
                      message: "LoggedIn successfully",
                      result: {
                        ...user._doc,
                        ...customer,
                        token: newToken,
                      },
                    });
                  }
              }
              return res.status(200).json({
                message: "LoggedIn successfully",
                result: { ...user._doc, token: newToken },
              });
            }
            return res.status(400).json({ error: "Wrong Password !!" });
          }
        }
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error In login!",
      });
    }
  },
};

module.exports.ChangePassword = (req, res) => {
  // call for passport authentication
  if (req.body.newPassword === req.body.confirmPassword) {
    admin
      .updateOne(
        { userId: req.body.userId },
        {
          $set: { password: req.body.confirmPassword, firstTimeLogin: "N" },
        }
      )
      .then((result) => {
        res.status(200).send({ message: "password updated successfully!" });
      })
      .catch((err) => {
        res.status(400).send({ message: "Invalid userId" });
      });
  } else {
    return res.status(400).send({ message: "password didnot match" });
  }
};

module.exports.register = (req, res, next) => {
  var adm = new admin();
  adm.userId = req.body.userId;
  adm.username = req.body.username;
  adm.password = req.body.password;
  adm.roleId = 3;
  adm.save((err, doc) => {
    if (!err)
      res.status(200).send({ message: "admin created successfully", doc });
    else {
      if (err.code == 11000)
        res.status(422).send(["Duplicate email adrress found."]);
      else return next(err);
    }
  });
};

module.exports.addcomment = (req, res) => {
  let comm = new Comment(req.body);
  comm
    .save()
    .then((result) => {
      res.status(200).send({
        message: "Comment Added Successfully",
        status: "OK",
        result: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        message: "Internal Error",
        status: "OK",
        result: err,
      });
    });
};

module.exports.getComments = (req, res) => {
  Comment.find({ customerId: req.params.id })
    .then((result) => {
      res
        .status("200")
        .send({ message: "comment got successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.updatecomment = (req, res) => {
  Comment.updateOne({ _id: req.body._id }, req.body)
    .then((result) => {
      res
        .status("200")
        .send({ message: "Updated  successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status(500).send({ error: "something went wrong !!", err });
    });
};

module.exports.deletecomment = (req, res) => {
  Comment.deleteOne({ _id: req.body._id })
    .then((result) => {
      res
        .status("200")
        .send({ message: " Deleted  successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.getCorrespondingData = (req, res) => {
  try {
    let { select } = req.query;
    if (typeof select === "string") {
      select = select.split(",").join(" ");
    }
    const Model = require(`../models/${req.params.name}.model`);
    Model.find({})
      .select(select ? select : "-__v -createdAt -updatedAt ")
      .then((result) => {
        res.status("200").send({
          message: req.params.name + " retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: "No such Field",
    });
  }
};

module.exports.updateStatus = (req, res) => {
  const statusModel = require("../models/Status.model");
  statusModel
    .updateOne({ statusId: req.body.statusId }, req.body)
    .then((result) => {
      res.status(200).json({
        status: "OK",
        message: `status updated successfully`,
        result,
      });
    })
    .catch((err) => {
      res.sendStatus(500);
      console.log(err);
    });
};

module.exports.updateCorrespondingData = (req, res) => {
  try {
    const vell = require(`../models/${req.params.name}.model`);
    vell
      .updateOne({ id: req.body.id }, req.body)
      .then(async (result) => {
        if (req.params.name === "Teacher") {
          AdminModel.findOne({ teacherId: req.body.id })
            .then((data) => {
              if (data) {
                data.userId = req.body.teacherMail;
                data.save((err, docs) => {
                  if (err) {
                    return res.status(500).json({
                      error: "Error in updating userId",
                    });
                  } else if (docs) {
                    return res.json({
                      status: "OK",
                      message: "teacher Updated successfully",
                      result,
                    });
                  }
                });
              } else {
                let body = {
                  username: req.body.TeacherName,
                  userId: req.body.teacherMail || req.body.teacherName,
                  roleId: 2,
                  teacherId: req.body.id,
                };
                const newTeacher = new admin(body);
                newTeacher
                  .save()
                  .then((result) => {
                    return res.json({
                      message: "teacher Updated successfully",
                      status: "OK",
                      result,
                    });
                  })
                  .catch((err) => {
                    console.log(err);
                    return res.status(500).json({
                      error: "Error in Creating userId",
                    });
                  });
              }
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({
                error: "Something went wrong",
              });
            });
        }
        else if(req.params.name === "Agent" && req.body.AgentLoginId){
          let loginData = await AdminModel.findOne({userId:req.body.AgentLoginId})
          if(loginData){
            loginData.roleId = req.body.AgentRole
            loginData.agentId = req.body.id
            loginData.username = req.body.AgentName
            await loginData.save()
          } else {
            let body = {
              username: req.body.AgentName,
              userId: req.body.agentLoginId,
              roleId:req.body.AgentRole,
              agentId:req.body.id
            }
            const newAgent = new admin(body);
            await newAgent.save()
          }
          return res.status(200).json({
            status: "OK",
            message: `${req.params.name} updated successfully`,
            result,
          });
        }
        else {
          return res.status(200).json({
            status: "OK",
            message: `${req.params.name} updated successfully`,
            result,
          });
        }
      })
      .catch((err) => {
        res.status(500);
        console.log(err);
      });
  } catch (err) {
    return res.status(500).json({ error: "no such field" });
  }
};

module.exports.DeleteCorrespondingData = (req, res) => {
  const vell = require(`../models/${req.params.name}.model`);
  vell
    .deleteOne({ id: req.params.id })
    .then((result) => {
      res
        .status("200")
        .send({ message: "deleted successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addField = (req, res) => {
  try {
    req.body.id = Math.floor(Math.random() * 100000) * Number(Date.now());
    req.body.statusId = Math.floor(Math.random() * 100000) * Number(Date.now());
    const { name } = req.params;
    const Model = require(`../models/${name}.model`);
    const model = new Model(req.body);
    model
      .save()
      .then(async (result) => {
        if (name == "Teacher") {
          let body = {
            username: result.TeacherName,
            userId: result.teacherMail || result.teacherName,
            roleId: 2,
            teacherId: result.id,
          };
          const newTeacher = new admin(body);
          await newTeacher
            .save()
        }
        if(name === "Agent"){
          let body = {
            username: result.AgentName,
            userId: result.agentLoginId,
            roleId:result.AgentRole,
            agentId:result.id
          }
          const newAgent = new admin(body);
          await newAgent.save()
        }
        return res.status("200").send({
          message: name + " added successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status("400").send({ error: "something went wrong !!" });
      });
  } catch (error) {
    console.log(error);
    res.status("400").send({ error: "something went wrong !!" });
  }
};

module.exports.addinvoice = (req, res) => {
  req.body.invoiceDate = new Date(req.body.invoiceDate);
  req.body.dueDate = new Date(req.body.dueDate);

  let invoice = new InvoiceModel(req.body);

  invoice
    .save()
    .then((val) => {
      res.status(200).send({
        status: "OK",
        message: "Invoice inserted Successfully",
        result: null,
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: "Bad Request",
        message: "Internal Error",
        result: null,
      });
    });
};

module.exports.getinvoices = (req, res) => {
  if (req.body.start == "") {
    let d = new Date();
    req.body.start =
      d.getFullYear().toString() + "-" + (d.getMonth() + 1).toString() + "-01";
    req.body.end =
      d.getFullYear().toString() + "-" + (d.getMonth() + 1).toString() + "-30";
  }

  let startDate = new Date(req.body.start);
  let endDate = new Date(req.body.end);

  InvoiceModel.find({ invoiceDate: { $gte: startDate, $lte: endDate } })
    .then((val) => {
      let parse = (d) => {
        let givenDate = new Date(d.toString());
        return (
          givenDate.getDay() +
          "-" +
          givenDate.getMonth() +
          "-" +
          givenDate.getFullYear()
        );
      };

      val = val.map((value, index) => {
        let ds = value.toJSON();
        ds.invoiceDate = parse(ds.invoiceDate);
        ds.dueDate = parse(ds.dueDate);

        return ds;
      });

      res.status(200).send({
        status: "OK",
        message: "Invoice fetched Successfully",
        result: val,
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: "Bad Request",
        message: "Internal Error",
        result: null,
      });
    });
};

module.exports.deleteInvoice = (req, res) => {
  InvoiceModel.deleteOne({ _id: req.body._id })
    .then((result) => {
      res.status(200).send({
        status: "OK",
        message: "Invoice Deleted Successfully",
        result: null,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Internal Error",
        result: null,
        status: "Bad request",
      });
    });
};

module.exports.resetPassword = (req, res) => {
  const { id } = req.params;
  AdminModel.findById(id)
    .then((userData) => {
      userData.password = "livesloka";
      userData.firstTimeLogin = "Y";
      userData
        .save()
        .then((response) => {
          return res.status(200).json({
            message: "password reset successful",
          });
        })
        .catch((error) => {
          return res.status(400).json({
            error: "error in password reset",
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ error: "error in password reset,Try again later" });
    });
};

module.exports.getAllAdmins = (req, res) => {
  AdminModel.find()
    .select("customerId")
    .populate("customerId", "firstName email")
    .then((data) => {
      return res.json({
        message: "data retrieved successfully",
        result: data,
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error: "error in retrieving data",
      });
    });
};

module.exports.getSingleTeacher = (req, res) => {
  AdminModel.find({ userId: req.params.id })
    .then((result) => {
      return res.status(200).json({ message: "Fetched successfully", result });
    })
    .catch((err) => {
      return res.status(400).json({ message: "Fetched  problem", err });
    });
};
