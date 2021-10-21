require("dotenv").config();
const Twilio = require("twilio");
const client = new Twilio(process.env.TWILIO_ID, process.env.TWILIO_TOKEN);
const AgentModel = require("../models/Agent.model");
const allZones = require("../models/timeZone.json");
const momentTZ = require("moment-timezone");


const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

exports.getNameFromTimezone = (timeZone) => {
  let selectedZoneUTCArray = allZones.filter(
    (zone) => zone.abbr === timeZone
  )[0].utc;
  let allTimeZones = momentTZ.tz.names();
  let selectedZone = allTimeZones.filter((name) =>
    selectedZoneUTCArray.includes(name)
  )[0];
  return selectedZone;
};

exports.sendSMS = async (message, phone) => {
  try {
    const sent = await client.messages.create({
      body: message,
      to: phone,
      from: process.env.TWILIO_NUMBER,
    });
    return { type: "error", result: sent };
  } catch (error) {
    console.log(error);
    return { type: "error", result: error };
  }
};

exports.sendAdminsMessage = async (message) => {
  try {
    let admins = await AgentModel.find({ AgentRole: 3 }).lean();
    asyncForEach(admins, async (admin) => {
      if (admin.phoneNumber) {
        await client.messages.create({
          body: message,
          to: admin.phoneNumber,
          from: process.env.TWILIO_NUMBER,
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

exports.asyncForEach = asyncForEach;
