const jwt = require("jsonwebtoken");
const admin = require("../models/Admin.model");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const classes = require("../models/classes.model");
const TimeZone = require("../models/timeZone.model");
const Currency = require("../models/Currency.model");
const Country = require("../models/Country.model");
const Status = require("../models/Status.model");
const ClassStatus = require("../models/ClassStatuses.model");
const Teacher = require("../models/Teacher.model");
const Agent = require("../models/Agent.model");
const Comment = require("../models/comment.model");

module.exports = {
  authentication(req, res, next) {
    console.log(req.body);

    admin.findOne({ userId: req.body.userId }, (err, user) => {
      console.log(user);
      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid Credentials..you got no access" });
      } else {
        console.log(user);
        if (user.password === req.body.password) {
          var payload = {
            _id: user._id,
            userId: user.userId,
          };
          var newToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXP,
          });
          var obj = {
            userId: user.userId,
            roleId: user.roleId,
            firstTimeLogin: user.firstTimeLogin,
            token: newToken,
          };
          return res
            .status(200)
            .json({ message: "LoggedIn successfully", obj });
        }
        return res.status(200).json({ message: "Wrong Password !!" });
      }
    });
  },
};

module.exports.PasswordConfirm = (req, res, next) => {
  // let encodedpass = bcrypt.hash(req.body.password)
  // console.log(encodedpass);
  if (req.body.password == req.body.confirmPassword) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        req.body.password = hash;
        console.log(req.body.password);
        admin
          .updateOne(
            { userId: req.body.userId },
            {
              $set: { password: req.body.password, firstTimeLogin: "N" },
            }
          )
          .then((result) => {
            result = null;
            res.status(200).send({
              message: "customer registration succesfully done!",
              result,
            });
          })
          .catch((err) => {
            res.status(400).send({ message: "Invalid userId" });
          });
      });
    });
  } else {
    return res.status(200).send({ message: "password didnot match" });
  }
};

// module.exports.ChangePassword = (req, res, next) => {
//     // call for passport authentication

//     console.log("inside else if of admion controller")
//     if (req.body.newPassword == req.body.confirmPassword) {
//         console.log("inside")
//         bcrypt.genSalt(10, (err, salt) => {
//             bcrypt.hash(req.body.confirmPassword, salt, (err, hash) => {
//                 req.body.confirmPassword = hash
//                 console.log(req.body.confirmPassword);
//                 admin.updateOne({ userId: req.body.userId },
//                     {
//                         $set: { password: req.body.confirmPassword, firstTimeLogin: 'N' }
//                     })
//                     .then((result) => {
//                         result = null;
//                         res.status(200).send({ message: "customer registration succesfully done!", result });
//                     })
//                     .catch((err) => { res.status(400).send({ message: "Invalid userId", }); })
//             });
//         });

//     }
//     else {
//         console.log("outside")
//         return res.status(200).send({ message: "password didnot match" })
//     }
// };

module.exports.ChangePassword = (req, res, next) => {
  // call for passport authentication

  console.log("inside else if of admion controller");
  if (req.body.newPassword == req.body.confirmPassword) {
    console.log("inside");
    admin
      .updateOne(
        { userId: req.body.userId },
        {
          $set: { password: req.body.confirmPassword, firstTimeLogin: "N" },
        }
      )
      .then((result) => {
        result = null;
        res
          .status(200)
          .send({ message: "customer registration succesfully done!", result });
      })
      .catch((err) => {
        res.status(400).send({ message: "Invalid userId" });
      });
  } else {
    console.log("outside");
    return res.status(200).send({ message: "password didnot match" });
  }
};

module.exports.register = (req, res, next) => {
  var adm = new admin();
  adm.userId = req.body.userId;
  adm.username = req.body.username;
  adm.password = req.body.password;
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

module.exports.addClass = (req, res) => {
  var newClass = new classes();
  (newClass.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (newClass.classDesc = req.body.classDesc),
    (newClass.className = req.body.className),
    (newClass.classesStatus = req.body.classesStatus),
    newClass
      .save()

      .then((result) => {
        res
          .status("200")
          .send({ message: "Class added successfully", status: "ok", result });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
};

module.exports.addtimezone = (req, res) => {
  var newTime = new TimeZone();
  (newTime.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (newTime.timeZoneName = req.body.timeZoneName),
    (newTime.timeZoneDesc = req.body.timeZoneDesc),
    (newTime.timeZoneStatus = req.body.timeZoneStatus);
  newTime
    .save()

    .then((result) => {
      res
        .status("200")
        .send({ message: "TimeZone added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addcurrency = (req, res) => {
  var newCur = new Currency();
  (newCur.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (newCur.currencyDesc = req.body.currencyDesc),
    (newCur.currencyName = req.body.currencyName),
    (newCur.currencyStatus = req.body.currencyStatus);
  newCur
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Currency added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addStatus = (req, res) => {
  var newStat = new Status();
  (newStat.statusId = req.body.statusId),
    (newStat.statusName = req.body.statusName),
    (newStat.statusDesc = req.body.statusDesc);
  newStat
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Status added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addcountry = (req, res) => {
  var newCountry = new Country();
  (newCountry.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (newCountry.countryName = req.body.countryName),
    (newCountry.countryDesc = req.body.countryDesc),
    (newCountry.countryStatus = req.body.countryStatus);
  newCountry
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Country added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addclassstatus = (req, res) => {
  var newClassStatus = new ClassStatus();
  (newClassStatus.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (newClassStatus.classStatusName = req.body.classStatusName),
    (newClassStatus.classStatusDesc = req.body.classStatusDesc),
    (newClassStatus.status = req.body.status);
  newClassStatus
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Country added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addTeacher = (req, res) => {
  var addTeachernew = new Teacher();
  (addTeachernew.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (addTeachernew.TeacherName = req.body.TeacherName),
    (addTeachernew.TeacherDesc = req.body.TeacherDesc),
    (addTeachernew.TeacherStatus = req.body.TeacherStatus);
  addTeachernew
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Teacher added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addAgent = (req, res) => {
  var addAgentnew = new Agent();
  (addAgentnew.id = Math.floor(Math.random() * 100) * Number(Date.now())),
    (addAgentnew.AgentName = req.body.AgentName),
    (addAgentnew.AgentDesc = req.body.AgentDesc),
    (addAgentnew.AgentStatus = req.body.AgentStatus);
  addAgentnew
    .save()
    .then((result) => {
      res
        .status("200")
        .send({ message: "Agent added successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.addcomment = (req, res) => {
  Comment.insertMany(req.body)
    .then((result) => {
      console.log(result);

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
  console.log(req.body);
  Comment.updateOne({ _id: req.body._id }, req.body)
    .then((result) => {
      res
        .status("200")
        .send({ message: " Updated  successfully", status: "ok", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.deletecomment = (req, res) => {
  console.log(req.body);
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
const getStatus = (req, res) => {
  Status.find({})
    .then((result) => {
      res
        .status("200")
        .send({ message: "status retrieved successfully", result });
    })
    .catch((err) => {
      res.status("400").send({ message: "something went wrong !!", err });
    });
};

module.exports.getCorrespondingData = (req, res) => {
  console.log(req.params.name);
  if (req.params.name == "classes") {
    classes
      .find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "classes retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "timezones") {
    TimeZone.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "TimeZones retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "currencies") {
    Currency.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "currencies retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "countries") {
    Country.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "Countries retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "statuses") {
    Status.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "status retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "ClassStatuses") {
    ClassStatus.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "Classstatus retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "Teachers") {
    Teacher.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "Teacher retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  } else if (req.params.name == "Agents") {
    Agent.find({})
      .select(" -_id -__v  ")
      .then((result) => {
        res.status("200").send({
          message: "Agents retrieved successfully",
          status: "ok",
          result,
        });
      })
      .catch((err) => {
        res.status("400").send({ message: "something went wrong !!", err });
      });
  }
};

module.exports.updateCorrespondingData = (req, res) => {
  const vell = require(`../models/${req.params.name}.model`);
  vell
    .updateOne({ id: req.body.id }, req.body)
    .then((result) => {
      res.status(200).json({
        status: "OK",
        message: `${req.params.name} updated successfully`,
        result,
      });
    })
    .catch((err) => {
      res.sendStatus(500);
      console.log(err);
    });
};

module.exports.DeleteCorrespondingData = (req, res) => {
  console.log(req.params.id);
  console.log(req.params.name);
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
