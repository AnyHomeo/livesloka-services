const times = require("../models/times.json");
const moment = require("moment");
const momentTZ = require("moment-timezone");

exports.getScheduleDescription = (slots, zone) => {
  let schedule = [];
  Object.keys(slots).forEach((day) => {
    if (slots[day].length) {
      splitSlots = slots[day].map(
        (slot) => slot.split(`${day.toUpperCase()}-`)[1]
      );
      console.log(splitSlots);
      let startSlot, endSlot;
      if (splitSlots.length == 1) {
        startSlot = splitSlots[0].split("-")[0];
        endSlot = splitSlots[0].split("-")[1];
      } else {
        for (let i = 0; i < times.length; i++) {
          const time = times[i];
          if (splitSlots.includes(time)) {
            startSlot = time.split("-")[0];
            endSlot = times[i + 1].split("-")[1];
            break;
          }
        }
      }
      let indianStartTime = moment(
        `${day}-${startSlot}`,
        "dddd-hh:mm A"
      ).format("YYYY-MM-DDTHH:mm:ss");
      let indianEndTime = moment(`${day}-${endSlot}`, "dddd-hh:mm A").format(
        "YYYY-MM-DDTHH:mm:ss"
      );
      let zonedStartTime = momentTZ
        .tz(indianStartTime, "Asia/Kolkata")
        .tz(zone)
        .format("dddd hh:mm A");
      let zonedEndTime = momentTZ
        .tz(indianEndTime, "Asia/Kolkata")
        .tz(zone)
        .format("hh:mm A");
      schedule.push(`${zonedStartTime}-${zonedEndTime}`);
    }
  });
  return schedule.join(", ");
};

// getScheduleDescription(
//   {
//     friday: [],
//     monday: [],
//     saturday: ["SATURDAY-07:00 PM-07:30 PM", "SATURDAY-07:30 PM-08:00 PM"],
//     sunday: ["SUNDAY-07:00 PM-07:30 PM", "SUNDAY-07:30 PM-08:00 PM"],
//     thursday: [],
//     tuesday: [],
//     wednesday: [],
//   },
//   "America/Detroit");
