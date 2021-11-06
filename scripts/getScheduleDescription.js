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
      console.log(splitSlots)
      let startSlot,endSlot;
      if (splitSlots.length == 1) {
        startSlot = splitSlots[0].split("-")[0];
        endSlot = splitSlots[0].split("-")[1];
        console.log(startSlot)
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
      console.log(startSlot,endSlot)
      console.log(`${day}-${startSlot}`)
      let indianStartTime = moment(`${day}-${startSlot}`,'dddd-hh:mm A').format("YYYY-MM-DDTHH:mm:ss")
      let indianEndTime = moment(`${day}-${endSlot}`,'dddd-hh:mm A').format("YYYY-MM-DDTHH:mm:ss")
      let zonedStartTime = momentTZ.tz(indianStartTime,"Asia/Kolkata").tz(zone).format("dddd hh:mm A")
      let zonedEndTime = momentTZ.tz(indianEndTime,"Asia/Kolkata").tz(zone).format("hh:mm A")
      console.log(momentTZ().format())
      console.log(`${zonedStartTime}-${zonedEndTime}`)
      schedule.push(`${zonedStartTime}-${zonedEndTime}`)
    }
  });
  return (schedule.join(", "))
};

// getScheduleDescription({
//   monday: [],
//   tuesday: ["TUESDAY-06:00 AM-06:30 AM","TUESDAY-05:30 AM-06:00 AM"],
//   wednesday: ["WEDNESDAY-07:30 PM-08:00 PM"],
//   thursday: [],
//   friday: ["FRIDAY-08:30 AM-09:00 AM","FRIDAY-09:00 AM-09:30 AM"],
//   saturday: [],
//   sunday: [],
// },'Europe/London');
