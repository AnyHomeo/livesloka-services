require("dotenv").config();
const Attendance = require("../models/Attendance");
const CustomerModel = require("../models/Customer.model");
const SchedulerModel = require("../models/Scheduler.model");
const Payments = require("../models/Payments");
const ClassHistoryModel = require("../models/ClassHistory.model");
const momentTZ = require("moment-timezone");
const { asyncForEach } = require("../config/helper");
var twilio = require("twilio");
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);

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

const changeZoomLink = async (scheduleId) => {
  let schedule = await SchedulerModel.findById(scheduleId).populate(
    "meetingAccount"
  );
  const {
    meetingLink,
    meetingAccount: { zoomJwt, zoomEmail, zoomPassword },
  } = schedule;

  if (meetingLink && meetingLink.includes("zoom")) {
    await fetch(
      `https://api.zoom.us/v2/meetings/${
        meetingLink.split("/")[4].split("?")[0]
      }`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${zoomJwt}`,
        },
      }
    );
  }
  const formData = {
    topic: "Livesloka Online Class",
    type: 3,
    password: zoomPassword,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      jbh_time: 0,
      mute_upon_entry: true,
      watermark: false,
      use_pmi: false,
      approval_type: 2,
      audio: "both",
      auto_recording: "none",
      waiting_room: false,
      meeting_authentication: false,
    },
  };
  let data = await fetch(`https://api.zoom.us/v2/users/${zoomEmail}/meetings`, {
    method: "post",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${zoomJwt}`,
    },
  });
  let response = await data.json();
  schedule.meetingLink = response.join_url;
  await schedule.save();
};

const sendMessageIfClassesLessThanOrEqualToZero = async (customers, scheduleId) => {
  let message = `
Namaskaram,

You have zero classes left in your current payment cycle. We request you to kindly complete the payment from Live Sloka app before the class starts to have uninterrupted learning. Please let us know if you have any payment-related issues.

Thank you for being with us.
Much Regards,
Live Sloka Team
  `;
  let customersToSendMessage = await CustomerModel.find({
    _id: { $in: customers },
    numberOfClassesBought: { $lte: 0 },
  }).select("whatsAppnumber");
  console.log(customersToSendMessage)
  if (customersToSendMessage.length) {
    customersToSendMessage = customersToSendMessage.map(
      (customer) => `${customer.countryCode}${customer.whatsAppnumber}`
    );
    // await changeZoomLink(scheduleId);
    await asyncForEach(customersToSendMessage, async (customer) => {
      console.log(customer,process.env.TWILIO_NUMBER)
      await client.messages.create({
        body: message,
        to: customer, // Text this number
        from: process.env.TWILIO_NUMBER, // From a valid Twilio number
      });
    });
  }
};

const postAttendance = (req, res) => {
  let {
    scheduleId,
    date,
    customers,
    requestedStudents,
    requestedPaidStudents,
    absentees,
  } = req.body;

  requestedStudents = Array.isArray(requestedStudents) ? requestedStudents : [];
  requestedPaidStudents = Array.isArray(requestedPaidStudents)
    ? requestedPaidStudents
    : [];
  absentees = Array.isArray(absentees) ? absentees : [];
  customers = Array.isArray(customers) ? customers : [];

  Attendance.findOne({ scheduleId, date })
    .then(async (alreadyGivenAttendance) => {
      try {
        if (alreadyGivenAttendance) {
          let newlyRequestedStudents = [];
          requestedStudents.forEach((student) => {
            if (
              !alreadyGivenAttendance.requestedStudents.includes(student) &&
              !alreadyGivenAttendance.requestedPaidStudents.includes(student)
            ) {
              newlyRequestedStudents.push(student);
            }
          });
          requestedPaidStudents.forEach((student) => {
            if (
              !alreadyGivenAttendance.requestedPaidStudents.includes(student) &&
              !alreadyGivenAttendance.requestedPaidStudents.includes(student)
            ) {
              newlyRequestedStudents.push(student);
            }
          });
          let allCustomers = await CustomerModel.find({
            _id: {
              $in: newlyRequestedStudents,
            },
          }).select("numberOfClassesBought");
          allCustomersHistory = allCustomers.map((customer) => ({
            customerId: customer._id,
            previousValue: customer.numberOfClassesBought,
            nextValue: customer.numberOfClassesBought + 1,
            comment: "Requested for a class!",
          }));
          await ClassHistoryModel.insertMany(allCustomersHistory);
          await CustomerModel.updateMany(
            { _id: { $in: newlyRequestedStudents } },
            { $inc: { numberOfClassesBought: 1 } }
          ); 
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
          let allCustomers = await CustomerModel.find({
            _id: {
              $in: [...customers, ...absentees],
            },
          }).select("numberOfClassesBought");
          allCustomersHistory = allCustomers.map((customer) => ({
            customerId: customer._id,
            previousValue: customer.numberOfClassesBought,
            nextValue: customer.numberOfClassesBought - 1,
            comment: "Attendance Taken!",
          }));
          await ClassHistoryModel.insertMany(allCustomersHistory);
          let data = await CustomerModel.updateMany(
            { _id: { $in: [...customers, ...absentees] } },
            { $inc: { numberOfClassesBought: -1 } }
          );
          // console.log(data);
          // await sendMessageIfClassesLessThanOrEqualToZero(
          //   [...customers, ...absentees],
          //   scheduleId
          // );
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
        console.log(error);
        return res.status(500).json({
          error: "something went wrong!!",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAllAttendanceByScheduleIdAndDate = (req, res) => {
  const { scheduleId } = req.params;
  const { date } = req.query;
  Attendance.findOne({
    scheduleId,
    date: momentTZ.tz(date, "Asia/Kolkata").format("YYYY-MM-DD"),
  })
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
        let customerId = schedule.students.filter((student) =>
          customerIds.some((customer) => student.equals(customer))
        )[0];
        let allAttendances = await Attendance.find({
          scheduleId: schedule._id,
        }).select("customers absentees requestedStudents createdAt").lean();
        let allPayments = await Payments.find({
          customerId,
        }).select("status type createdAt").lean();
        allPayments = allPayments.map((payment) => ({
          isPaymentObject: true,
          ...payment,
          createdAt: new Date(payment.createdAt).getTime(),
        }));
        let finalAttendanceObject = allAttendances.map((attendance) => {
          return {
            isPaymentObject: false,
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
            createdAt: new Date(attendance.createdAt).getTime(),
          };
        });
        return {
          data: [...finalAttendanceObject, ...allPayments]
            .sort((x, y) => {
              return x.createdAt - y.createdAt;
            })
            .map((object) => ({
              ...object,
              createdAt: new Date(object.createdAt),
            })),
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
