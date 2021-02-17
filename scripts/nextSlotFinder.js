function nextSlotFinder(slot) {
  let daysarr = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];
  let day = slot.split("-")[0];
  let endTime = slot.split("-")[2];
  if (endTime === "12:00 AM") {
    let index = daysarr.indexOf(day) + 1;
    if (index === daysarr.length) {
      index = 0;
    }
    day = daysarr[index];
  }
  let newEndTime = "";
  let endTimeWithoutAM = endTime.split(" ")[0];
  let meredian = endTime.split(" ")[1];
  if (endTimeWithoutAM.endsWith(":30")) {
    let newEndTimeHours = parseInt(endTimeWithoutAM.split(":")[0]) + 1;
    if (newEndTimeHours === 13) {
      newEndTimeHours = 1;
    }
    newEndTime = `0${newEndTimeHours}`.slice(-2) + ":00";
    if (endTime === "11:30 AM" || endTime === "11:30 PM") {
      meredian = meredian === "AM" ? "PM" : "AM";
    }
  } else {
    let newEndTimeHours = parseInt(endTimeWithoutAM.split(":")[0]);
    newEndTime = `0${newEndTimeHours}`.slice(-2) + ":30";
  }
  console.log(`${day}-${endTime}`, newEndTime, meredian);
  return `${day}-${endTime}-${newEndTime} ${meredian}`;
}

module.exports.nextSlotFinder = nextSlotFinder;
