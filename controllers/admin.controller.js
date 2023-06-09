require('dotenv').config();
const jwt = require('jsonwebtoken');
const AdminModel = require('../models/Admin.model');
const admin = require('../models/Admin.model');
const Comment = require('../models/comments.model');
const CustomerModel = require('../models/Customer.model');
const TimeZoneModel = require('../models/timeZone.model');
var twilio = require('twilio');
const { isValidObjectId } = require('mongoose');
const { mongooseError } = require('../config/helper');
const AgentModel = require('../models/Agent.model');
const client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);
const momentTZ = require('moment-timezone');
const { logError } = require('../config/logger');

exports.authentication = async (req, res) => {
  try {
    let user = await admin
      .findOne({
        $or: [
          { userId: req.body.userId.toLowerCase() },
          { userId: req.body.userId },
        ],
      })
      .lean();
    if (!user) {
      return res.status(400).json({ error: 'Invalid UserId or Password' });
    }
    if (user.password === req.body.password) {
      var payload = {
        _id: user._id,
        userId: user.userId,
        role: user.roleId,
      };
      var newToken = jwt.sign(payload, process.env.JWT_SECRET);
      delete user.password;
      let customer = await CustomerModel.findById(user.customerId)
        .select('timeZoneId firstName lastName phone whatsAppnumber -_id')
        .lean();
      if (customer) {
        let timeZone = await TimeZoneModel.findOne({
          id: customer.timeZoneId,
        })
          .select('timeZoneName -_id')
          .lean();
        if (timeZone) {
          return res.status(200).json({
            message: 'LoggedIn successfully',
            result: {
              ...user,
              ...customer,
              timeZone: timeZone.timeZoneName,
              token: newToken,
            },
          });
        } else {
          return res.status(200).json({
            message: 'LoggedIn successfully',
            result: {
              ...user,
              ...customer,
              token: newToken,
            },
          });
        }
      } else {
        if (user.agentId) {
          const agent = await AgentModel.findOne({ id: user.agentId })
            .populate('role')
            .lean();
          return res.status(200).json({
            message: 'LoggedIn successfully',
            result: {
              ...agent,
              ...user,
              token: newToken,
            },
          });
        } else {
          return res.status(200).json({
            message: 'LoggedIn successfully',
            result: { ...user, token: newToken },
          });
        }
      }
    }
    return res.status(400).json({ error: 'Wrong Password !!' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error In login!',
    });
  }
};

exports.changePassword = (req, res) => {
  // call for passport authentication
  if (req.body.newPassword === req.body.confirmPassword) {
    admin
      .updateOne(
        { userId: req.body.userId },
        {
          $set: { password: req.body.confirmPassword, firstTimeLogin: 'N' },
        }
      )
      .then((result) => {
        res.status(200).send({ message: 'password updated successfully!' });
      })
      .catch((error) => {
        logError(error);
        res.status(400).send({ message: 'Invalid userId' });
      });
  } else {
    return res.status(400).send({ message: 'password didnot match' });
  }
};

exports.register = (req, res, next) => {
  var adm = new admin();
  adm.userId = req.body.userId;
  adm.username = req.body.username;
  adm.password = req.body.password;
  adm.roleId = 3;
  adm.save((err, doc) => {
    if (!err)
      res.status(200).send({ message: 'admin created successfully', doc });
    else {
      if (err.code == 11000)
        res.status(422).send(['Duplicate email adrress found.']);
      else return next(err);
    }
  });
};

exports.addcomment = async (req, res) => {
  try {
    let comment = new Comment(req.body);
    await comment.save();
    return res.json({ message: 'comment added successfully', result: comment });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ message: error.message || 'Something went wrong!' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { customerId } = req.params;
    let comments = await Comment.find({ customer: customerId })
      .populate('message')
      .populate('createdBy')
      .sort({ timeStamp: -1 });
    return res.send({
      message: 'Comments retrieved successfully',
      result: comments,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: error.message || 'Something went wrong!' });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const result = await Comment.updateOne(
      { _id: commentId },
      { $set: req.body }
    );
    return res.json({ message: 'Comment updated successfully', result });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: error.message || 'Something went wrong!', error });
  }
};

exports.deleteComment = (req, res) => {
  const { commentId } = req.params;
  Comment.deleteOne({ _id: commentId })
    .then((result) => {
      res.json({
        message: 'Comment deleted successfully',
        result,
      });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: error.message || 'Something went wrong!', error });
    });
};

exports.getCorrespondingData = (req, res) => {
  try {
    let { select, populate, populateFields } = req.query;
    if (typeof select === 'string') {
      select = select.split(',').join(' ');
    }
    const Model = require(`../models/${req.params.name}.model`);
    Model.find({})
      .select(select ? select : '-__v -createdAt -updatedAt ')
      .populate(populate, populateFields)
      .then((result) => {
        res.status('200').send({
          message: req.params.name + ' retrieved successfully',
          status: 'ok',
          result,
        });
      })
      .catch((err) => {
        res.status('400').send({ message: 'something went wrong !!', err });
      });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: 'No such Field',
    });
  }
};

exports.updateStatus = (req, res) => {
  const statusModel = require('../models/Status.model');
  statusModel
    .updateOne({ statusId: req.body.statusId }, req.body)
    .then((result) => {
      res.status(200).json({
        status: 'OK',
        message: `status updated successfully`,
        result,
      });
    })
    .catch((error) => {
      res.sendStatus(500);
      console.log(error);
    });
};

exports.getCommentsByCustomerIds = async (req, res) => {
  try {
    const { customers } = req.query;
    if (customers) {
      const customerIds = customers.split(',');

      let comments = await Comment.find({
        timeStamp: {
          $gte: momentTZ().tz('Asia/Kolkata').startOf('day').format(),
          $lte: momentTZ().tz('Asia/Kolkata').endOf('day').format(),
        },
        customer: { $in: customerIds },
      }).sort({ timeStamp: -1 });

      comments = Object.values(
        comments.reduce((accumulator, comment) => {
          if (!accumulator[comment.customer]) {
            accumulator[comment.customer] = comment;
          }
          return accumulator;
        }, {})
      );

      return res.status(200).json({
        message: 'Comments retrieved successfully',
        result: comments,
      });
    } else {
      return res.status(400).json({
        message: 'Customer Ids are required',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateCorrespondingData = (req, res) => {
  try {
    const vell = require(`../models/${req.params.name}.model`);
    if (!req.body._id) {
      return res.status(500).json({ error: 'id is required' });
    }
    vell
      .updateOne({ _id: req.body._id }, req.body)
      .then(async (result) => {
        if (req.params.name === 'Teacher') {
          AdminModel.findOne({ teacherId: req.body.id })
            .then((data) => {
              if (data) {
                data.userId = req.body.teacherMail;
                data.save((err, docs) => {
                  if (err) {
                    return res.status(500).json({
                      error: 'Error in updating userId',
                    });
                  } else if (docs) {
                    return res.json({
                      status: 'OK',
                      message: 'teacher Updated successfully',
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
                      message: 'teacher Updated successfully',
                      status: 'OK',
                      result,
                    });
                  })
                  .catch((error) => {
                    console.log(error);
                    return res.status(500).json({
                      error: 'Error in Creating userId',
                    });
                  });
              }
            })
            .catch((error) => {
              console.log(error);
              return res.status(500).json({
                error: 'Something went wrong',
              });
            });
        } else if (req.params.name === 'Agent' && req.body.AgentLoginId) {
          let loginData = await AdminModel.findOne({
            userId: req.body.AgentLoginId,
          });
          if (loginData) {
            loginData.roleId = req.body.AgentRole;
            loginData.agentId = req.body.id;
            loginData.username = req.body.AgentName;
            await loginData.save();
          } else {
            let body = {
              username: req.body.AgentName,
              userId: req.body.AgentLoginId,
              roleId: req.body.AgentRole,
              agentId: req.body.id,
            };
            const newAgent = new admin(body);
            await newAgent.save();
          }
          return res.status(200).json({
            status: 'OK',
            message: `${req.params.name} updated successfully`,
            result,
          });
        } else {
          return res.status(200).json({
            status: 'OK',
            message: `${req.params.name} updated successfully`,
            result,
          });
        }
      })
      .catch((error) => {
        res.status(500).json({ error });
        console.log(error);
      });
  } catch (err) {
    return res.status(500).json({ error: 'no such field' });
  }
};

exports.deleteCorrespondingData = (req, res) => {
  const model = require(`../models/${req.params.name}.model`);
  const { id } = req.params;
  model
    .deleteOne(isValidObjectId(id) ? { _id: id } : { id })
    .then((result) => {
      res
        .status('200')
        .send({ message: 'deleted successfully', status: 'ok', result });
    })
    .catch((error) => {
      console.log(error);
      res.status('400').send({ message: 'something went wrong !!', error });
    });
};

exports.addField = (req, res) => {
  try {
    req.body.id = Math.floor(Math.random() * 100000) * Number(Date.now());
    req.body.statusId = Math.floor(Math.random() * 100000) * Number(Date.now());
    const { name } = req.params;
    const Model = require(`../models/${name}.model`);
    const doc = new Model(req.body);
    const errors = doc.validateSync();
    if (errors) {
      return res.status(400).json({
        error: mongooseError(errors),
        result: errors,
      });
    }
    doc
      .save()
      .then(async (result) => {
        if (name == 'Teacher') {
          let body = {
            username: result.TeacherName,
            userId: result.teacherMail || result.teacherName,
            roleId: 2,
            teacherId: result.id,
          };
          const newTeacher = new admin(body);
          await newTeacher.save();
        }
        if (name === 'Agent') {
          let body = {
            username: result.AgentName,
            userId: result.AgentLoginId,
            roleId: result.AgentRole,
            agentId: result.id,
          };
          const newAgent = new admin(body);
          await newAgent.save();
        }
        return res.status('200').send({
          message: name + ' added successfully',
          status: 'ok',
          result,
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status('400').send({ error: 'something went wrong !!' });
      });
  } catch (error) {
    console.log(error);
    res.status('400').send({ error: 'something went wrong !!' });
  }
};

exports.resetPassword = (req, res) => {
  const { id } = req.params;
  const { isEmail } = req.query;
  if (!isEmail) {
    AdminModel.findById(id)
      .then((userData) => {
        userData.password = 'livesloka';
        userData.firstTimeLogin = 'Y';
        userData
          .save()
          .then((response) => {
            return res.status(200).json({
              message: 'password reset successful',
            });
          })
          .catch((error) => {
            return res.status(400).json({
              error: 'error in password reset',
            });
          });
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(500)
          .json({ error: 'error in password reset,Try again later' });
      });
  } else {
    AdminModel.findOne({ userId: id })
      .then((userData) => {
        userData.password = 'livesloka';
        userData.firstTimeLogin = 'Y';
        userData
          .save()
          .then((response) => {
            return res.status(200).json({
              message: 'password reset successful',
            });
          })
          .catch((error) => {
            return res.status(400).json({
              error: 'error in password reset',
            });
          });
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(500)
          .json({ error: 'error in password reset,Try again later' });
      });
  }
};

exports.getAllAdmins = (req, res) => {
  AdminModel.find()
    .select('customerId username userId')
    .populate('customerId', 'firstName email')
    .then((data) => {
      return res.json({
        message: 'data retrieved successfully',
        result: data,
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error: 'error in retrieving data',
      });
    });
};

exports.getSingleTeacher = (req, res) => {
  AdminModel.find({ userId: req.params.id })
    .then((result) => {
      return res.status(200).json({ message: 'Fetched successfully', result });
    })
    .catch((error) => {
      return res.status(400).json({ message: 'Fetched  problem', error });
    });
};

exports.addOtpToAdminCollection = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid Email Address.',
      });
    }
    const customer = await CustomerModel.findOne({ email: userId });
    if (!customer) {
      return res.status(400).json({
        error: 'Invalid Email Address.',
      });
    }
    let otp = Math.floor(1000 + Math.random() * 9000);
    let loginDetails = await AdminModel.findOne({ userId });
    if (!loginDetails) {
      return res.status(400).json({
        error: 'Invalid Email Address.',
      });
    }

    loginDetails.otp = otp;
    await loginDetails.save();
    await client.messages.create({
      body: `Live Sloka: Your OTP for Password Reset is ${otp}`,
      to: `${customer.countryCode}${customer.whatsAppnumber}`.trim(), // Text this number
      from: process.env.TWILIO_NUMBER, // From a valid Twilio number
    });

    return res.json({
      message: 'OTP sent to ***** *' + customer.whatsAppnumber.slice(-4),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong!' });
  }
};

exports.validateOtpAndResetPassword = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const admin = await AdminModel.findOne({ userId, otp });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid OTP,Try again!!' });
    }
    admin.password = 'livesloka';
    admin.firstTimeLogin = 'Y';
    await admin.save();
    return res.json({
      message:
        "Password Reset Successful!, Use 'Livesloka' as Temporary password",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'error in password reset,Try again later' });
  }
};

exports.postAddress = async (req, res) => {
  try {
    const { id } = req.params;
    let customer = await CustomerModel.findById(id);
    if (customer) {
      let login = await AdminModel.findOne({ userId: customer.email });
      login.address = req.body;
      await login.save();
      return res.json({
        message: 'Address posted successfully!',
      });
    } else {
      return res.status(500).json({ error: 'Invalid customer id' });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'error in password reset,Try again later' });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (isValidObjectId(id)) {
      let customer = await CustomerModel.findById(id);
      if (customer) {
        let login = await AdminModel.findOne({ userId: customer.email });
        return res.json({
          message: 'Address retrieved successfully!',
          result: login.address,
        });
      } else {
        return res.status(500).json({ error: 'Invalid customer id' });
      }
    } else {
      return res.status(500).json({ error: 'Invalid customer id' });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 'Something went wrong!,Try again later' });
  }
};
