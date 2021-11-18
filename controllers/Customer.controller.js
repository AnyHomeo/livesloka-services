const CustomerModel = require('../models/Customer.model');
const AdminModel = require('../models/Admin.model');
const AttendanceModel = require('../models/Attendance');
const SubjectsModel = require('../models/Subject.model');
const ScheduleModel = require('../models/Scheduler.model');
const PaymentModel = require('../models/Payments');
const TimeZoneModel = require('../models/timeZone.model');
const TeacherLeavesModel = require('../models/TeacherLeaves.model');
const moment = require('moment');
const momentTZ = require('moment-timezone');
const SubjectModel = require('../models/Subject.model');
const SchedulerModel = require('../models/Scheduler.model');
const { nextSlotFinder } = require('../scripts/nextSlotFinder');
const allZones = require('../models/timeZone.json');
const generateScheduleDescription = require('../scripts/generateScheduleDescription');
const timeZoneModel = require('../models/timeZone.model');
const CancelledClassesModel = require('../models/CancelledClasses.model');
const generateScheduleDays = require('../scripts/generateScheduleDays');
const TeacherModel = require('../models/Teacher.model');
const SubscriptionModel = require('../models/Subscription');
let filters = require('../config/filters.json');
const { getScheduleDescription } = require('../scripts/getScheduleDescription');

module.exports = {
  async registerCustomer(req, res) {
    let { subjectId, proposedAmount, proposedCurrencyId, timeZoneId } =
      req.body;
    if (!subjectId) {
      return res.status(500).json({
        error: 'Subject is Required!!',
        status: 'Internal Server Error',
        result: null,
      });
    }
    if (!proposedAmount) {
      let subject = await SubjectModel.findOne({ id: subjectId }).lean();
      req.body.proposedAmount = subject.amount ? subject.amount : 50;
    }
    if (timeZoneId && !proposedCurrencyId) {
      let zone = await TimeZoneModel.findOne({ id: timeZoneId })
        .populate('currency')
        .lean();
      req.body.proposedCurrencyId =
        zone.currency && zone.currency.id ? zone.currency.id : undefined;
    }
    let customerRegData = new CustomerModel(req.body);
    customerRegData
      .save()
      .then(async (val) => {
        let user = {};
        try {
          const data = await AdminModel.findOne({
            userId: val.email,
          });
          if (data) {
            return res.json({
              status: 'OK',
              message: 'Customer added, Use old credentials to login',
              result: val,
            });
          } else {
            if (req.body.firstName && req.body.lastName) {
              user.username = req.body.firstName + ' ' + req.body.lastName;
            } else if (req.body.firstName) {
              user.username = req.body.firstName;
            } else if (req.body.lastName) {
              user.username = req.body.lastName;
            } else {
              user.username =
                'Livesloka User ' + Math.floor(Math.random() * 1000000 + 1);
            }
            if (req.body.email) {
              user.userId = req.body.email;
            } else if (req.body.phone) {
              user.userId = req.body.phone;
            } else {
              user.userId =
                'Livesloka' + Math.floor(Math.random() * 1000000 + 1);
            }
            user.roleId = 1;
            user.customerId = val._id;
            user.password = 'livesloka';
            let newUserdata = new AdminModel(user);
            newUserdata
              .save()
              .then((newUser) => {
                return res.status(200).send({
                  status: 'OK',
                  message:
                    'Customer data inserted and Login Credentials created Successfully',
                  result: val,
                });
              })
              .catch((err) => {
                return res.status(500).json({
                  status: 'Internal Server Error',
                  error: 'Error in creating Username and Password',
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
          status: 'Bad Request',
          message: 'Invalid Syntax',
          result: null,
        });
      });
  },

  async details(req, res) {
    CustomerModel.find({})
      .select('-customerId')
      .sort({
        createdAt: -1,
      })
      .then((result) => {
        res.status(200).json({
          message: 'Customer data retrieved',
          status: 'OK',
          result,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          message: 'something went Wrong',
          err,
        });
      });
  },

  async updateCustomer(req, res) {
    CustomerModel.updateOne(
      {
        _id: req.body._id,
      },
      req.body
    )
      .then((result) => {
        if (req.body.email) {
          AdminModel.updateOne(
            {
              customerId: req.body._id,
            },
            {
              userId: req.body.email,
            }
          )
            .then((updatedUser) => {
              return res.status(200).send({
                status: 'OK',
                message: 'Customer data updated Successfully',
                result: null,
              });
            })
            .catch((err) => {
              console.log(err);
              return res.status(500).json({
                error: 'error in updating userid',
              });
            });
        } else {
          res.status(200).send({
            status: 'OK',
            message: 'Customer data updated Successfully',
            result: null,
          });
        }
      })
      .catch((err) => {
        res.status(500).json({
          error: 'something went wrong',
        });
        console.log(err);
      });
  },

  getRespectiveDetails: async (req, res) => {
    let { params } = req.query;
    params = params.split(',').join(' ');
    if (params.includes('password')) {
      return res.status(500).json({ error: `Password Can't be retrieved` });
    }
    AdminModel.find({})
      .select(`${params} -password`)
      .then((users) => {
        return res.status(200).json({
          message: 'retrieved all users',
          result: users,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: 'unable to retrieve users',
          result: null,
        });
      });
  },

  deleteCustomer: async (req, res) => {
    try {
      const { customerId } = req.params;
      let customer = await CustomerModel.findById(customerId);
      let allCustomersWithThatEmail = await CustomerModel.find({
        email: customer.email,
      });
      await CustomerModel.findByIdAndDelete(customerId);
      if (allCustomersWithThatEmail && allCustomersWithThatEmail.length === 1) {
        await AdminModel.deleteOne({
          userId: customer.email,
        });
        return res.json({
          message: 'Deleted customer and their Login Details Successfully!',
        });
      }
      return res.json({
        message: 'Deleted Successfully!',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!!',
      });
    }
  },

  getCustomerData: (req, res) => {
    const { customerId } = req.params;
    let { params } = req.query;
    if (params) {
      params = params.split(',').join(' ');
      CustomerModel.findById(customerId)
        .select(params)
        .then((docs) => {
          return res.status(200).json({
            message: 'data retrieved successfully',
            result: docs,
          });
        })
        .catch((err) =>
          res.status(500).json({
            error: 'Internal Server Error',
            result: null,
          })
        );
    } else {
      return res.status(400).json({
        error: 'Please provide Params',
        result: null,
      });
    }
  },

  getCustomersAllData: async (req, res) => {
    try {
      let { params } = req.query;
      const subjects = await SubjectsModel.find().select('subjectName id');
      params = params.split(',').join(' ');
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
            message: 'retrieved students successfully',
            result: data,
          });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({
            message: 'Error in retrieving data',
          });
        });
    } catch (error) {}
  },

  getAllSchedulesByMail: async (req, res) => {
    try {
      const { email } = req.body;
      let customers = await CustomerModel.find({
        email,
      })
        .select(
          '_id scheduleDescription firstName noOfClasses paymentDate paidTill numberOfClassesBought isJoinButtonEnabledByAdmin timeZoneId'
        )
        .lean();
      let mainSchedules = await Promise.all(
        customers.map(async (customer) => {
          let isJoinButtonDisabled = true;
          if (customer.paidTill) {
            isJoinButtonDisabled =
              moment().unix() - moment(customer.paidTill).unix() > 0 &&
              !customer.isJoinButtonEnabledByAdmin;
          } else {
            isJoinButtonDisabled = customer.numberOfClassesBought <= 0;
          }
          if (customer.isJoinButtonEnabledByAdmin) {
            isJoinButtonDisabled = false;
          }
          let actualSchedule = await ScheduleModel.findOne({
            students: {
              $in: [customer._id],
            },
            isDeleted: {
              $ne: true,
            },
          }).lean();
          if (actualSchedule) {
            let allCancelledClasses = await CancelledClassesModel.find({
              scheduleId: actualSchedule._id,
              studentId: customer._id,
            });
            let teacher = await TeacherModel.findOne({
              id: actualSchedule.teacher,
            }).lean();
            let timeZone = await timeZoneModel.findOne({
              id: customer.timeZoneId,
            });
            let selectedZoneUTCArray = allZones.filter(
              (zone) => zone.abbr === (timeZone ? timeZone.timeZoneName : 'EST')
            )[0].utc;
            console.log(selectedZoneUTCArray,timeZone.timeZoneName);
            let allTimeZones = momentTZ.tz.names();
            let selectedZones = allTimeZones.filter((name) =>
              selectedZoneUTCArray.includes(name)
            );
            let teacherLeave = await TeacherLeavesModel.countDocuments({
              $or: [
                {
                  scheduleId: actualSchedule._id,
                  date: {
                    $gte: momentTZ().tz('Asia/Kolkata').startOf('day').format(),
                    $lte: momentTZ().tz('Asia/Kolkata').endOf('day').format(),
                  },
                },
                {
                  entireDay: true,
                  teacherId: teacher._id,
                  date: {
                    $gte: momentTZ().tz('Asia/Kolkata').startOf('day').format(),
                    $lte: momentTZ().tz('Asia/Kolkata').endOf('day').format(),
                  },
                },
              ],
            });
            let subject = await SubjectModel.findOne({
              _id: actualSchedule.subject,
            });
            let subscription = await SubscriptionModel.find({
              customerId: customer._id,
              isActive: true,
            });

            return {
              ...actualSchedule,
              isJoinButtonDisabled,
              isSubscribed: !!subscription.length,
              customerId: customer._id,
              customerName: customer.firstName,
              numberOfClassesBought: customer.numberOfClassesBought,
              paidTill: customer.paidTill,
              scheduleDescription: customer.scheduleDescription,
              scheduleDescription2: getScheduleDescription(actualSchedule.slots,selectedZones[0]),
              // !actualSchedule.isSummerCampClass
              //   ? generateScheduleDescription(
              //       actualSchedule.slots,
              //       selectedZones[0]
              //     )
              //   : 'Monday to Friday - ' +
              //     generateScheduleDescription(
              //       actualSchedule.slots,
              //       selectedZones[0]
              //     )
              //       .split('and')[0]
              //       .split('-')[1],

              isTeacherOnLeave: !!teacherLeave,
              scheduleDays: generateScheduleDays(
                actualSchedule.slots,
                selectedZones[0]
              ),
              subject,
              cancelledClasses: allCancelledClasses,
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
      return res.status(500).json({
        error: 'Error in retrieving the data',
      });
    }
  },

  getRequestedData: async (req, res) => {
    try {
      let { email, q } = req.query;
      q = q.split(',').join(' ');
      const customers = await CustomerModel.find({
        email,
      }).select(q);
      return res.json({
        message: 'Data retrieved sucessfully',
        result: customers,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Internal Server error',
      });
    }
  },

  insertDataFromWix: async (req, res) => {
    try {
      const { data } = req.body;
      data['field:comp-kk7je66v'] =
        typeof data['field:comp-kk7je66v'] === 'string'
          ? data['field:comp-kk7je66v'].toUpperCase()
          : 'IST';
      let timeZoneSelected = await TimeZoneModel.findOne({
        timeZoneName: data['field:comp-kk7je66v'],
      }).lean();
      let selectedSubjectNames = data['field:comp-kk7je66r1']
        .split(',')
        .map((name) => name.trim());
      let selectedSubjects = await SubjectModel.find({
        subjectName: {
          $in: selectedSubjectNames,
        },
      }).lean();
      let user = {
        lastName: data['field:comp-kk7je65y'],
        firstName: data['field:comp-kk7je6651'],
        timeZoneId: timeZoneSelected ? timeZoneSelected.id : '',
        whatsAppnumber: data['field:comp-kk7je66p'],
        email: data['field:comp-kk7je66n'],
        gender:
          typeof data['field:comp-kk926n0p'] === 'string'
            ? data['field:comp-kk926n0p'].toLowerCase()
            : '',
        age: data['field:comp-kk7je668'],
      };
      let finalUserInsertableData = selectedSubjects.map((subject) => {
        return {
          ...user,
          subjectId: subject.id,
          proposedAmount: subject.amount,
          firstName: `${user.firstName} ${subject.subjectName}`,
        };
      });
      CustomerModel.insertMany(finalUserInsertableData, async (err, docs) => {
        if (err) {
          console.log(err);
        } else {
          const userIfExists = await AdminModel.findOne({
            userId: data['field:comp-kk7je66n'],
          });
          if (!userIfExists) {
            const newUser = new AdminModel({
              userId: data['field:comp-kk7je66n'],
              password: 'livesloka',
              roleId: 1,
              customerId: docs[0]._id,
              username: data['field:comp-kk7je6651'],
            });
            newUser.save().then((savedDoc) => {
              return res.json({
                Success: true,
                message: 'Login credentials created successfully',
              });
            });
          } else {
            return res.json({
              Success: true,
            });
          }
        }
      });
    } catch (error) {
      console.log(error);
      const { data } = req.body;
      let user = {
        lastName: data['field:comp-kk7je65y'],
        firstName: data['field:comp-kk7je6651'],
        whatsAppnumber: data['field:comp-kk7je66p'],
        email: data['field:comp-kk7je66n'],
        gender: data['field:comp-kk926n0p'],
        age: data['field:comp-kk7je668'],
      };
      const newCustomer = new CustomerModel(user);
      newCustomer
        .save()
        .then(async (data) => {
          const userIfExists = await AdminModel.findOne({
            userId: data['field:comp-kk7je66n'],
          });
          if (!userIfExists) {
            const newUser = new AdminModel({
              userId: data['field:comp-kk7je66n'],
              password: 'livesloka',
              roleId: 1,
              customerId: docs[0]._id,
              username: data['field:comp-kk7je6651'],
            });
            newUser.save().then((savedDoc) => {
              return res.json({
                Success: true,
                message: 'Login credentials created successfully',
              });
            });
          } else {
            return res.json({
              Success: true,
            });
          }
        })
        .catch((err) => {
          return res.status(500).json({
            error: 'Error in Inserting Customers',
          });
        });
    }
  },

  getClassDashBoardData: async (req, res) => {
    try {
      const { slot, date } = req.query;
      let nextSlot = nextSlotFinder(slot);
      let customersLessThanMinus2 = await CustomerModel.countDocuments({
        numberOfClassesBought: {
          $lte: -2,
        },
        autoDemo: {
          $ne: true
        },
        classStatusId: '113975223750050',
      });
      let customersEqualToMinus1 = await CustomerModel.countDocuments({
        numberOfClassesBought: -1,
        autoDemo: {
          $ne: true
        },
        classStatusId: '113975223750050',
      });
      let customersEqualTo0 = await CustomerModel.countDocuments({
        numberOfClassesBought: 0,
        autoDemo: {
          $ne: true
        },
        classStatusId: '113975223750050',
      });
      let demoCustomers = await CustomerModel.countDocuments({
        classStatusId: '38493085684944',
      });
      let newCustomers = await CustomerModel.countDocuments({
        classStatusId: '108731321313146850',
      });
      let customersInClass = await CustomerModel.countDocuments({
        classStatusId: '113975223750050',
      });
      let autoDemoCustomers = await CustomerModel.countDocuments({
        autoDemo: true,
      });
      let day = slot.split('-')[0].toLowerCase();
      let schedulesRightNow = await SchedulerModel.find({
        ['slots.' + day]: {
          $in: [slot],
        },
        isDeleted: {
          $ne: true,
        },
      })
        .select('meetingLink className scheduleDescription lastTimeJoinedClass')
        .lean();
      schedulesRightNow = schedulesRightNow.map((schedule) => {
        return {
          ...schedule,
          isTeacherJoined: schedule.lastTimeJoinedClass === date,
        };
      });
      let nextSchedules = await SchedulerModel.find({
        ['slots.' + day]: {
          $nin: [slot],
          $in: [nextSlot],
        },
        isDeleted: {
          $ne: true,
        },
      })
        .select('meetingLink className scheduleDescription')
        .lean();
      return res.json({
        customersEqualToMinus1,
        customersEqualTo0,
        customersLessThanMinus2,
        newCustomers,
        demoCustomers,
        customersInClass,
        schedulesRightNow,
        nextSchedules,
        autoDemoCustomers,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong !',
      });
    }
  },

  getCustomersAllDataByUserIdSettings: async (req, res) => {
    const isValidSettings = (filters) =>
      Object.keys(filters).some((filterKey) => filters[filterKey].length);

    try {
      const { userId } = req.params;
      const user = await AdminModel.findById(userId).select('settings');
      let query = {};
      if (
        user &&
        user.settings &&
        user.settings.filters &&
        Object.keys(user.settings.filters).length &&
        isValidSettings(user.settings.filters)
      ) {
        const { filters } = user.settings;
        if (filters.classStatuses && filters.classStatuses.length) {
          query.classStatusId = {
            $in: filters.classStatuses.map((item) => item.id),
          };
        }
        if (filters.timeZones && filters.timeZones.length) {
          query.timeZoneId = {
            $in: filters.timeZones.map((item) => item.id),
          };
        }
        if (filters.classes && filters.classes.length) {
          query.classId = {
            $in: filters.classes.map((item) => item.id),
          };
        }
        if (filters.teachers && filters.teachers.length) {
          query.teacherId = {
            $in: filters.teachers.map((item) => item.id),
          };
        }
        if (filters.countries && filters.countries.length) {
          query.countryId = {
            $in: filters.countries.map((item) => item.id),
          };
        }
        if (filters.subjects && filters.subjects.length) {
          query.subjectId = {
            $in: filters.subjects.map((item) => item.id),
          };
        }
        if (filters.agents && filters.agents.length) {
          query.agentId = {
            $in: filters.agents.map((item) => item.id),
          };
        }
        if (filters.paidClasses && filters.paidClasses.length) {
          query.numberOfClassesBought = {
            $in: filters.paidClasses.map((item) => parseInt(item)),
          };
        }
        query.isSummerCampStudent = { $ne: true };
        CustomerModel.find(query)
          .select('-customerId')
          .populate('login')
          .sort({
            createdAt: -1,
          })
          .lean()
          .then((result) => {
            console.log(result)
            res.status(200).json({
              message: 'Customer data retrieved',
              status: 'OK',
              result: result,
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({
              message: 'something went Wrong',
              err,
            });
          });
      } else {
        CustomerModel.find({ isSummerCampStudent: { $ne: true } })
          .select('-customerId')
          .populate('login')
          .sort({
            createdAt: -1,
          })
          .lean()
          .then((result) => {
            res.status(200).json({
              message: 'Customer data retrieved',
              status: 'OK',
              result: result,
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(400).json({
              message: 'something went Wrong',
              err,
            });
          });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong',
      });
    }
  },

  getUserTimeZone: async (req, res) => {
    try {
      const { customerId } = req.params;

      const customerTZId = await CustomerModel.findById(customerId).select(
        'timeZoneId'
      );
      if (customerTZId) {
        console.log(customerTZId);
        const timeZone = await TimeZoneModel.findOne({
          id: customerTZId.timeZoneId,
        }).lean();

        let selectedZoneUTCArray = allZones.filter(
          (zone) => zone.abbr === timeZone.timeZoneName
        )[0].utc;

        let allTimeZones = momentTZ.tz.names();
        let selectedZones = allTimeZones.filter((name) =>
          selectedZoneUTCArray.includes(name)
        );

        return res.json({
          result: selectedZones[0],
          message: 'Timezone retrieved successfully!',
        });
      } else {
        return res.status(400).json({
          error: 'Timezone need to be added',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong',
      });
    }
  },

  getSingleUser: async (req, res) => {
    try {
      const { id } = req.params;
      let customer = await CustomerModel.findById(id)
        .select('timeZoneId firstName lastName phone whatsAppnumber -_id')
        .lean();
      if (customer) {
        let timeZone = await TimeZoneModel.findOne({ id: customer.timeZoneId })
          .select('timeZoneName -_id')
          .lean();
        return res.status(200).json({
          message: 'Retrieved Data successfully',
          result: { ...customer, timeZone: timeZone.timeZoneName },
        });
      }
      return res.status(400).json({
        error: 'No user with that Id',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!',
      });
    }
  },

  dataByUserID: async (req, res) => {
    try {
      const { userId } = req.params;

      let details = await AdminModel.findOne({ userId })
        .select('customerId roleId username teacherId -_id')
        .lean();

      if (details.roleId === 1 && details.customerId) {
        let customer = await CustomerModel.findById(details.customerId)
          .select('timeZoneId firstName lastName phone whatsAppnumber -_id')
          .lean();
        if (customer) {
          let timeZone = await TimeZoneModel.findOne({
            id: customer.timeZoneId,
          })
            .select('timeZoneName -_id')
            .lean();
          return res.status(200).json({
            message: 'Retrieved Data successfully',
            result: { ...customer, timeZone: timeZone.timeZoneName },
          });
        }
      } else if (details.roleId === 2 && details.teacherId) {
        let teacher = await TeacherModel.findOne({ id: details.teacherId })
          .select('TeacherName -_id')
          .lean();
        //  if (teacher) {
        //    let timeZone = await TimeZoneModel.findOne({
        //      id: customer.timeZoneId,
        //    })
        //      .select('timeZoneName -_id')
        //      .lean();

        //  }

        return res.status(200).json({
          message: 'Retrieved Data successfully',
          result: { ...teacher, timeZone: 'IST' },
        });
      }

      return res.status(400).json({
        error: 'No user with that Id',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!',
      });
    }
  },

  getAdminById: async (req, res) => {
    try {
      const { userId } = req.params;

      let data = await AdminModel.findOne({
        userId,
      })
        .select('username -_id')
        .lean();

      console.log(data);
      return res.send(data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!',
      });
    }
  },

  updateLastTimeJoined: async (req, res) => {
    try {
      let { email, scheduleId } = req.params;
      let allUsersWithThatEmail = await CustomerModel.find({ email })
        .select('_id email firstName')
        .lean();
      allUsersWithThatEmail = allUsersWithThatEmail.map((user) => user._id);
      let schedule = await ScheduleModel.findById(scheduleId)
        .select('students')
        .lean();
      let selectedCustomer = schedule.students.filter((student) =>
        allUsersWithThatEmail.some((user) => user.equals(student))
      )[0];
      let response = await CustomerModel.updateOne(
        { _id: selectedCustomer },
        { lastTimeJoined: new Date() }
      );
      if (response.nModified === 1) {
        return res.json({
          message: 'last time joined Updated Successfully',
        });
      } else {
        return res.status(500).json({
          error: 'Error in updating last time joined!',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Error updating join class',
      });
    }
  },

  getStatistics: async (req, res) => {
    try {
      const { day } = req.params;
      let allSchedules = await SchedulerModel.find({
        isDeleted: {
          $ne: true,
        },
        ['slots.' + day + '.0']: { $exists: true },
      })
        .select(
          'slots students meetingLink teacher className subject lastTimeJoinedClass demo'
        )
        .populate('subject', 'subjectName')
        .populate(
          'students',
          'firstName lastTimeJoined lastName numberOfClassesBought timeZoneId email whatsAppnumber'
        )
        .lean();
      let allTeachers = await TeacherModel.find({
        id: {
          $in: [...new Set(allSchedules.map((schedule) => schedule.teacher))],
        },
      })
        .select('TeacherName id Phone_number')
        .lean();
      allSchedules = allSchedules.map((schedule) => ({
        ...schedule,
        teacher: allTeachers.filter(
          (teacher) => teacher.id === schedule.teacher
        )[0],
      }));

      return res.json({
        result: allSchedules.map((schedule) => {
          return {
            ...schedule,
            isTeacherJoined:
              typeof schedule.lastTimeJoinedClass === 'object'
                ? momentTZ(schedule.lastTimeJoinedClass)
                    .tz('Asia/Kolkata')
                    .format('YYYY-MM-DD') ===
                  momentTZ().tz('Asia/Kolkata').format('YYYY-MM-DD')
                : false,
            students: schedule.students.map((student) => ({
              ...student,
              isStudentJoined:
                typeof student.lastTimeJoined === 'object'
                  ? momentTZ(student.lastTimeJoined)
                      .tz('Asia/Kolkata')
                      .format('YYYY-MM-DD') ===
                    momentTZ().tz('Asia/Kolkata').format('YYYY-MM-DD')
                  : false,
            })),
          };
        }),
      });
    } catch (err) {
      console.log(err);
      return res.json({
        error: 'Something went wrong!!',
      });
    }
  },

  getInclassAndDemoStudents: async (req, res) => {
    try {
      let allDemoAndInclassSchedules = await ScheduleModel.find({
        isDeleted: {
          $ne: true,
        },
      })
        .select('students teacher className demo')
        .populate('students', 'firstName lastName email')
        .lean();
      let allCustomers = [];
      let totalStudents = 0;
      allDemoAndInclassSchedules.forEach((schedule) => {
        if (schedule.students && schedule.students.length) {
          schedule.students.forEach((student) => {
            if (student) {
              allCustomers.push({
                ...student,
                ...schedule,
                customerId: student._id,
                students: undefined,
              });
            }
          });
        }
      });

      return res.json({
        message: 'All inclass and demo students retrieved',
        result: allCustomers,
      });
    } catch (error) {
      console.log(error);
      return res.json({
        error: 'Something went wrong',
      });
    }
  },

  insertCustomersFromWebsite: async (req, res) => {
    try {
      const { subjects, email } = req.body;
      req.body.gender = req.body.gender
        ? req.body.gender.toLowerCase()
        : 'male';
      if (!email) {
        return res.status(400).json({
          error: 'Email is Required',
        });
      }
      if (Array.isArray(subjects) && !subjects.length) {
        return res.status(400).json({
          error: 'Subjects are required!',
        });
      }
      let allSubjects = await SubjectModel.find({
        id: {
          $in: subjects,
        },
      });
      let allCustomers = allSubjects.map((subject) => ({
        ...req.body,
        subjectId: subject.id,
        firstName: req.body.firstName + ' ' + subject.subjectName,
        proposedAmount: subject.amount,
      }));
      let insertedCustomers = await CustomerModel.insertMany(allCustomers);
      let userAlreadyExists = await AdminModel.findOne({
        userId: email,
      });
      if (!userAlreadyExists) {
        const newUser = new AdminModel({
          userId: email,
          roleId: 1,
          customerId: insertedCustomers[0]._id,
          userName: req.body.firstName,
        });
        await newUser.save();
        return res.json({
          message: 'Registered Successfully!!',
        });
      }
      return res.json({
        message: 'Registered Successfully!',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!!',
      });
    }
  },

  getCustomerDataByFilters: async (req, res) => {
    try {
      let { filter } = req.query;
      let customerData = await CustomerModel.find(filters[filter]);
      return res.json({
        result: customerData,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!!',
      });
    }
  },

  getCustomerByEmail: async (req, res) => {
    try {
      let { email } = req.params;
      let data = await AdminModel.findOne({ userId: email });

      if (data) {
        return res.json({
          result: {
            username: data.username,
            email: data.userId,
            profilePic: data.profilePic,
            profileLocation: data.profileLocation,
          },
        });
      } else {
        return res.status(400).json({
          error: 'No user found!',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!!',
      });
    }
  },

  UpdateProfilePicByEmail: async (req, res) => {
    try {
      let { email, profilePic, location } = req.body;
      let data = await AdminModel.findOne({ userId: email });

      if (data) {
        data.profilePic = profilePic;
        data.profileLocation = location;

        await data.save();
        return res.json({
          result: 'Updated successfully',
        });
      } else {
        return res.status(400).json({
          error: 'No user found!',
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: 'Something went wrong!!',
      });
    }
  },
};
