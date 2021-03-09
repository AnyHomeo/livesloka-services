const moment = require("moment");
const momentTZ = require("moment-timezone");

function nextWeekdayDate(date, day_in_week) {
  var ret = new Date(date || new Date());
  ret.setDate(ret.getDate() + ((day_in_week - ret.getDay() + 7) % 7) + 1);
  return ret;
}

function getCorrectNumbers(startTime, startTimeHours, endTimeHours) {
  if (!startTime.split(":")[1].trim().endsWith("AM")) {
    if (!(startTimeHours === 12 || startTimeHours === 12.5))
      startTimeHours += 12;
    if (!(endTimeHours === 12 || endTimeHours === 12.5)) endTimeHours += 12;
    if (startTimeHours === 23.5) endTimeHours = 24;
  } else {
    if (startTimeHours === 12) startTimeHours = 0;
    if (startTimeHours === 12.5) startTimeHours = 0.5;
    if (endTimeHours === 12) endTimeHours = 0;
    if (endTimeHours === 12.5) endTimeHours = 0.5;
    if (startTimeHours === 11.5) endTimeHours = 12;
  }
  return [startTimeHours, endTimeHours];
}

function getScheduleDescription(schedule, zone) {
  let scheduleDescription = [];
  Object.keys(schedule).forEach((day) => {
    let slots = schedule[day];
    let startTimes = [];
    let endTimes = [];
    slots.forEach((slot) => {
      let startTime = slot.split("-")[1];
      let endTime = slot.split("-")[2];
      let startTimeHours = parseInt(startTime.split(":")[0].trim());
      let endTimeHours = parseInt(endTime.split(":")[0].trim());
      let bothNumbers;
      if (startTime.split(":")[1].trim().startsWith("00")) {
        endTimeHours += 0.5;
        bothNumbers = getCorrectNumbers(
          startTime,
          startTimeHours,
          endTimeHours
        );
      } else {
        startTimeHours += 0.5;
        bothNumbers = getCorrectNumbers(
          startTime,
          startTimeHours,
          endTimeHours
        );
      }
      startTimes.push(bothNumbers[0]);
      endTimes.push(bothNumbers[1]);
    });
    if (startTimes.length && endTimes.length) {
      let minStartTime = Math.min(...startTimes);
      let maxEndTime = Math.max(...endTimes);
      let dateToday = JSON.stringify(
        nextWeekdayDate(
          new Date(),
          [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].indexOf(day)
        )
      )
        .split("T")[0]
        .split('"')[1];
      console.log(moment(dateToday).add(minStartTime, "hours").format());
      scheduleDescription.push(
        `${momentTZ(moment(dateToday).add(minStartTime, "hours").format())
          .tz(zone)
          .format("dddd - hh:mm A")} to ${momentTZ(
          moment(dateToday).add(maxEndTime, "hours").format()
        )
          .tz(zone)
          .format("hh:mm A")}`
      );
    }
  });
  return scheduleDescription.join(" and ");
}
module.exports = getScheduleDescription;
