require("dotenv").config();
const CustomerModel = require("../models/Customer.model");
const TeacherModel = require("../models/Teacher.model");
const OptionsModel = require("../models/SlotOptions");
const TimeZoneModel = require("../models/timeZone.model");
const ObjectId = require("mongoose").Types.ObjectId;
const SchedulerModel = require("../models/Scheduler.model");
const allZones = require("../models/timeZone.json");
const times = require("../models/times.json");
const momentTZ = require("moment-timezone");
const moment = require("moment");
const twilio = require("twilio");
var client = new twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);

const getStartTime = (slots, zoneName) => {
  let day = slots[0].split("-")[0].toLowerCase();
  let slotsWithoutDay = slots.map(
    (slot) => `${slot.split("-")[1]}-${slot.split("-")[2]}`
  );
  let selectedStartTime = "";
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (slotsWithoutDay.includes(time)) {
      selectedStartTime = time;
      break;
    }
  }
  let time = moment(
    `${day} ${selectedStartTime.split("-")[0]}`,
    "dddd hh:mm A"
  ).format("YYYY-MM-DD hh:mm");
  time = momentTZ
    .tz(time, "Asia/Kolkata")
    .clone()
    .tz(zoneName)
    .format("dddd-hh:mm A");
  return time.split("-");
};

exports.getTeacherSlots = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const selectedTeacher = await TeacherModel.findOne({
      id: teacherId,
    })
      .select("TeacherName availableSlots")
      .lean();

    let schedules = await SchedulerModel.find({
      teacher: teacherId,
      isDeleted: {
        $ne: true,
      },
      demo: false,
    }).select("scheduleDescription className");

    return res.json({
      result: { ...selectedTeacher, schedules },
      message: "Teacher retrieved successfully!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getOnlyDemoCustomers = async (req, res) => {
  try {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    }
    const demoCustomers = await CustomerModel.find({
      classStatusId: "38493085684944",
    })
      .select(select)
      .lean();

    return res.json({
      message: "Demo customers retrieved successfully",
      result: demoCustomers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.postAnOption = async (req, res) => {
  try {
    const { customer, options, teacher } = req.body;

    if (!customer) {
      return res.status(400).json({ error: "Customer Id is Required!" });
    }

    if (!teacher) {
      return res.status(400).json({ error: "Teacher Id is Required!" });
    }

    if (!Array.isArray(options) || !options.length) {
      return res.status(400).json({ error: "Minimum 1 slot is required!" });
    }

    if (!ObjectId.isValid(customer)) {
      return res.status(400).json({ error: "Invalid Customer" });
    }

    let customerData = await CustomerModel.findById(customer);
    if (!customerData) {
      return res.status(400).json({ error: "Invalid Customer" });
    }
    if (!customerData.whatsAppnumber.toString().startsWith("+")) {
      return res.status(400).json({ error: "Invalid Phone number" });
    }

    let alreadyExists = await OptionsModel.countDocuments({
      customer: customerData._id,
    });
    if (!alreadyExists) {
      let newOption = new OptionsModel(req.body);
      await newOption.save();
      console.log(customerData);
      if (customerData.whatsAppnumber) {
        let messageResponse = await client.messages.create({
          body: `Live Sloka: book your slot on ${process.env.USER_CLIENT_URL}/options/${newOption._id}`,
          to: customerData.whatsAppnumber, // Text this number
          from: process.env.TWILIO_NUMBER, // From a valid Twilio number
        });
        console.log(messageResponse);
        return res.json({
          message: "Options Created and Url sent successfully",
        });
      } else {
        return res.json({
          message:
            "Options Created but message not sent as there is no Phone Number available",
        });
      }
    } else {
      return res.status(500).json({
        message:
          "Options already exists for this customer!, please delete and try again",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getOptions = async (req, res) => {
  try {
    const result = await OptionsModel.find()
      .populate("customer", "id firstName lastName")
      .populate("schedules", "scheduleDescription className")
      .populate("teacherData", "TeacherName id")
      .lean();
    return res.json({
      result,
      message: "All Options Retrieved Successfully!!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.updateAnOption = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOption = await OptionsModel.findByIdAndUpdate(id, req.body);
    return res.json({
      message: "Option updated successfully",
      result: updatedOption,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.deleteAnOption = async (req, res) => {
  try {
    const { optionId } = req.params;

    if (!optionId)
      return res.status(400).json({ error: "Option Id is Required" });
    if (!ObjectId.isValid(optionId))
      return res
        .status(400)
        .json({ error: "Option Id must be a valid objectId" });

    const deletedOption = await OptionsModel.deleteOne({ _id: optionId });
    if (deletedOption.n && deletedOption.ok) {
      return res.json({ message: "Option deleted successfully!" });
    } else {
      return res.status(400).json({ message: "Option not deleted" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getAnOption = async (req, res) => {
  try {
    const { id } = req.params;
    const option = await OptionsModel.findById(id)
      .populate("customer", "id firstName lastName timeZoneId")
      .populate("schedules", "scheduleDescription className slots")
      .populate("teacherData", "TeacherName id")
      .lean();
    let selectedZone;
    if (option) {
      if (option.customer.timeZoneId) {
        let timeZone = await TimeZoneModel.findOne({
          id: option.customer.timeZoneId,
        });
        let selectedZoneUTCArray = allZones.filter(
          (zone) => zone.abbr === timeZone.timeZoneName
        )[0].utc;
        let allTimeZones = momentTZ.tz.names();
        selectedZone = allTimeZones.filter((name) =>
          selectedZoneUTCArray.includes(name)
        )[0];
      } else {
        selectedZone = "Asia/Kolkata";
      }
      let newSlots = option.options.map((optionObj) => {
        let optionSlots = {};
        Object.keys(optionObj).forEach((day) => {
          if (day !== "_id") {
            let [dayStr, time] = getStartTime([optionObj[day]], selectedZone);
            optionSlots[dayStr.toLowerCase()] = time;
          } else {
            optionSlots[day] = optionObj[day];
          }
        });
        return optionSlots;
      });

      let scheduledSlots = option.schedules.map((schedule) => {
        let objToReturn = {};
        Object.keys(schedule.slots).forEach((day) => {
          if (schedule.slots[day].length) {
            [dayStr, time] = getStartTime(schedule.slots[day], selectedZone);
            objToReturn[dayStr.toLowerCase()] = time;
          }
        });
        return { ...objToReturn, _id: schedule._id };
      });

      return res.json({
        message: "Option retrieved successfully",
        result: [
          ...newSlots.map((slot) => ({ ...slot, isScheduled: false })),
          ...scheduledSlots.map((slot) => ({ ...slot, isScheduled: true })),
        ],
      });
    } else {
      return res
        .status(500)
        .json({ error: "Link Expired please contact Agent for new Link" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
};

exports.getSingleOption = async (req,res) => {
  
}