const jwt = require("jsonwebtoken");
const admin = require("../models/Admin.model");
const Comment = require("../models/comments.model");
const InvoiceModel = require("../models/Invoice.model");

module.exports = {
  authentication(req, res, next) {
    admin.findOne({ userId: req.body.userId }, (err, user) => {
      if (!user) {
        return res.status(400).json({ error: "Invalid userId or Password" });
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
          return res.status(200).json({
            message: "LoggedIn successfully",
            result: { ...user._doc, token: newToken },
          });
        }
        return res.status(400).json({ error: "Wrong Password !!" });
      }
    });
  },
};

module.exports.ChangePassword = (req, res) => {
  // call for passport aut hentication
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
  console.log(req.body);
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

module.exports.getCorrespondingData = (req, res) => {
  try {
    // console.log(req.params.name);
    const Model = require(`../models/${req.params.name}.model`);
    // console.log(Object.keys(Model.schema.paths));
    Model.find({})
      .select(" -_id -__v -createdAt -updatedAt ")
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
      .then((result) => {
        res.status(200).json({
          status: "OK",
          message: `${req.params.name} updated successfully`,
          result,
        });
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
      .then((result) => {
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
