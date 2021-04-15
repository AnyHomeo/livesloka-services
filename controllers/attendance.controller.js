const Attendance = require("../models/Attendance");
const CustomerModel = require("../models/Customer.model");
const SchedulerModel = require("../models/Scheduler.model");
const Payments = require("../models/Payments");
const ClassHistoryModel = require("../models/ClassHistory.model");

const getAttendance = (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  Attendance.find({
    customers: { $in: [id] },
  })
    .select("date time scheduleId")
    .populate("Schedule")
    .then((userAttendance) => {
      if (date) {
        let filteredData = [];
        let filterDateArr = date.split("-").map((num) => parseInt(num));
        userAttendance.forEach((attendance) => {
          let dateArr = attendance.date.split("-").map((num) => parseInt(num));
          if (
            dateArr[2] >= filterDateArr[2] &&
            dateArr[1] >= filterDateArr[1] &&
            dateArr[0] >= filterDateArr[0]
          ) {
            filteredData.push(attendance);
          }
        });
        userAttendance = filteredData;
      }
      return res.status(200).json({
        message: "Attendance Retrieved Successfully!",
        result: userAttendance,
      });
    })
    .catch((error) => {
      console.log(error);
      return res
        .status(500)
        .json({ error: "Error in Retrieving Attendance", result: null });
    });
};

const postAttendance = (req, res) => {
  let { scheduleId, date, customers, requestedStudents,requestedPaidStudents, absentees } = req.body;

  requestedStudents = Array.isArray(requestedStudents) ? requestedStudents : [];
  requestedPaidStudents = Array.isArray(requestedPaidStudents) ? requestedPaidStudents : [];
  absentees = Array.isArray(absentees) ? absentees : [];
  customers = Array.isArray(customers) ? customers : [];

  Attendance.findOne({ scheduleId, date })
    .then(async (alreadyGivenAttendance) => {
      try {
        if (alreadyGivenAttendance) {
          let newlyRequestedStudents = [];
           requestedStudents.forEach((student) => {
            if (!alreadyGivenAttendance.requestedStudents.includes(student) && !alreadyGivenAttendance.requestedPaidStudents.includes(student)) {
              newlyRequestedStudents.push(student);
            }
          });
          requestedPaidStudents.forEach((student) => {
            if (!alreadyGivenAttendance.requestedPaidStudents.includes(student) && !alreadyGivenAttendance.requestedPaidStudents.includes(student)) {
              newlyRequestedStudents.push(student);
            }
          });
          let allCustomers = await CustomerModel.find({_id:{
            $in:newlyRequestedStudents
          }}).select("numberOfClassesBought")
          allCustomersHistory = allCustomers.map( customer => ({
            customerId:customer._id,
            previousValue:customer.numberOfClassesBought,
            nextValue:customer.numberOfClassesBought + 1,
            comment:"Requested for a class!"
          }))
          await ClassHistoryModel.insertMany(allCustomersHistory)
          await CustomerModel.updateMany(
            { _id: { $in: newlyRequestedStudents } },
            { $inc: { numberOfClassesBought: 1 } }
          )
          alreadyGivenAttendance.customers = customers;
          alreadyGivenAttendance.absentees = absentees;
          alreadyGivenAttendance.requestedStudents = requestedStudents;
          alreadyGivenAttendance.requestedPaidStudents = requestedPaidStudents;
          alreadyGivenAttendance.save((err, savedAttendance) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                error: "Error in updating Attendance",
              });
            } else {
              return res.json({
                message: "Attendance updated successfully",
              });
            }
          });
        } else {
          let allCustomers = await CustomerModel.find({_id:{
            $in:[...customers, ...absentees]
          }}).select("numberOfClassesBought")
          allCustomersHistory = allCustomers.map( customer => ({
            customerId:customer._id,
            previousValue:customer.numberOfClassesBought,
            nextValue:customer.numberOfClassesBought - 1,
            comment:"Attendance Taken!"
          }))
          await ClassHistoryModel.insertMany(allCustomersHistory)
          await CustomerModel.updateMany(
            { _id: { $in: [...customers, ...absentees] } },
            { $inc: { numberOfClassesBought: -1 } }
          )
          const attendance = new Attendance(req.body);
          attendance.save((err, doc) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                error: "Error in Taking Attendance",
              });
            } else {
              return res.json({
                message: "Attendance Added successfully",
              });
            }
          });
        } 
      } catch (error) {
        console.log(error)
        return res.status(500).json({
          error:"something went wrong!!"
        })
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAllAttendanceByScheduleIdAndDate = (req, res) => {
  const { scheduleId } = req.params;
  const { date } = req.query;
  Attendance.findOne({ scheduleId, date })
    .then((data) => {
      return res.json({
        message: "Attendance retrieved successfully",
        result: data,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving Attendance",
      });
    });
};

const getAttendanceByScheduleId = (req, res) => {
  const { scheduleId } = req.params;
  Attendance.find({ scheduleId })
    .populate("customers", "firstName email")
    .populate("requestedStudents", "firstName email")
    .populate("requestedPaidStudents", "firstName email")
    .populate("absentees", "firstName email")
    .then((data) => {
      return res.json({
        message: "Attendance retrieved successfully",
        result: data,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving Attendance",
      });
    });
};

const getAttendanceWithPayments = async (req, res) => {
  try {
    const { email } = req.params;
    let customers = await CustomerModel.find({
      email,
    }).lean();
    let customerIds = customers.map((customer) => customer._id);
    let schedules = await SchedulerModel.find({
      students: {
        $in: customerIds,
      },
      isDeleted: {
        $ne: true,
      },
    })
      .select("subject students")
      .populate("subject", "subjectName")
      .lean();
    let scheduleIds = schedules.map((schedule) => schedule._id);
    let result = await Promise.all(
      schedules.map(async (schedule) => {
        let customerId = schedule.students.filter(student => customerIds.some(customer => student.equals(customer)))[0]
        let allAttendances = await Attendance.find({
          scheduleId: schedule._id,
        }).lean();
        let allPayments = await Payments.find({
          customerId
        }).lean()
        allPayments = allPayments.map(payment => ({
          isPaymentObject:true,
          ...payment,
          createdAt:new Date(payment.createdAt).getTime()
        }))
        let finalAttendanceObject = allAttendances.map((attendance) => {
          return {
            isPaymentObject:false,
            isPresent: attendance.customers
              ? attendance.customers.some((customer) =>
                  customer.equals(customerId)
                )
              : false,
            isAbsent: attendance.absentees
              ? attendance.absentees.some((customer) =>
                  customer.equals(customerId)
                )
              : false,
            isRequestedStudent: attendance.requestedStudents
              ? attendance.requestedStudents.some((customer) =>
                  customer.equals(customerId)
                )
              : false,
            createdAt:new Date(attendance.createdAt).getTime()
          };
        });
        return {
          data: [...finalAttendanceObject,...allPayments]
          .sort((x, y) => {
            return x.createdAt - y.createdAt;
        }).map(object => ({...object,createdAt:new Date(object.createdAt)})),
          subject: schedule.subject ? schedule.subject.subjectName : "",
        };
      })
    );
    return res.json({
      message: "retrieved successfully!!",
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!!",
      result: null,
    });
  }
};

module.exports = {
  getAttendance,
  postAttendance,
  getAllAttendanceByScheduleIdAndDate,
  getAttendanceByScheduleId,
  getAttendanceWithPayments,
};
