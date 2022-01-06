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
    return { type: "success", result: sent };
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

exports.isFutureDate = (date) => {
  let now = new Date().getTime();
  let dateUnix = new Date(date).getTime()

  return dateUnix > now
}

exports.asyncForEach = asyncForEach;

exports.getDemoMessage = (subject, date, time, userId) => {
  return `
    Namaskaram,
  
  We are delighted to see your interest in ${subject} Classes. Thank you for reserving your slot for a ${subject} demo class. We request you to attend the demo class on ${date} at ${time} from mylivesloka.com as our teacher would be more than eager to share her expertise with you.
  
  Your first-time login credentials for mylivesloka.com are as follows
  
  User Id: ${userId}
  Password:  livesloka
  
  You can currently log in to mylivesloka.com with the above credentials to find your slot booking.
  
  In case of any queries contact:
  Ram       +91 83093 41208
  Bhargav   +91 80744 74524
  Lahari    +91 83285 30889
  
  We wish you happy learning.
  
  Regards.
  Live Sloka Team
    `;
};