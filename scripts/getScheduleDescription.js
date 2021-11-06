const times = require("../models/times.json");
const moment = require("moment")
const momentTZ = require("moment-timezone")

exports.getScheduleDescription = (slots, zone) => {
  let schedule = [];
  Object.keys(slots).forEach((day) => {
    if (slots[day].length) {
      splitSlots = slots[day].map(
        (slot) => slot.split(`${day.toUpperCase()}-`)[1]
      );
      let startSlot,endSlot;
      if (splitSlots.length == 1) {
        startSlot = splitSlots[0].split("-")[0];
        endSlot = splitSlots[0].split("-")[1];
      } else {
        for (let i = 0; i < times.length; i++) {
          const time = times[i];
          if (splitSlots.includes(time)) {
            startSlot = time.split("-")[0];
            endSlot = times[i+1].split("-")[1];
            break
          }
        }
      }
      let indianStartTime = moment(`${day}-${startSlot}`,'dddd-hh:mm A').format().replace("+00:00","+05:30")
      let indianEndTime = moment(`${day}-${endSlot}`,'dddd-hh:mm A').format().replace("+00:00","+05:30")
      let zonedStartTime = momentTZ(indianStartTime).tz(zone).format("dddd hh:mm A")
      let zonedEndTime = momentTZ(indianEndTime).tz(zone).format("hh:mm A")
      schedule.push(`${zonedStartTime}-${zonedEndTime}`)
    }
  });
  return schedule.join(", ")
};