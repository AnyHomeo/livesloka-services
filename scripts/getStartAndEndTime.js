module.exports.getStartAndEndTime = (slots) => {
  let startTimeArr = [];
  let endTimeArr = [];
  slots.forEach((slot) => {
    let splittedSlotArray = slot.split("-");
    let startTime = splittedSlotArray[1].trim();
    let endTime = splittedSlotArray[2].trim();
    let startTimeHours = parseInt(startTime.split(":")[0].trim());
    let endTimeHours = parseInt(endTime.split(":")[0].trim());
    if (startTime.endsWith("PM") && !startTime.startsWith("12")) {
      startTimeHours = startTimeHours + 12;
    }
    if (startTime.endsWith("AM") && startTime.startsWith("12")) {
      startTimeHours = 0;
    }
    if (startTime.split(":")[1].trim().startsWith("30")) {
      startTimeHours = startTimeHours + 0.5;
    }
    if (endTime.endsWith("PM") && !endTime.startsWith("12")) {
      endTimeHours = endTimeHours + 12;
    }
    if (endTime.endsWith("AM") && endTime.startsWith("12")) {
      endTimeHours = 0;
    }
    if (endTime.split(":")[1].trim().startsWith("30")) {
      endTimeHours = endTimeHours + 0.5;
    }
    startTimeArr.push(startTimeHours);
    endTimeArr.push(endTimeHours);
  });
  let startTimeNumber = Math.min(...startTimeArr);
  let endTimeNumber = Math.max(...endTimeArr);
  let final = "";
  if (startTimeNumber % 1 !== 0) {
    final =
      Math.floor(startTimeNumber) >= 12
        ? `${
            Math.floor(endTimeNumber) !== 12
              ? Math.floor(endTimeNumber) - 12
              : Math.floor(endTimeNumber)
          }:30 PM`
        : `${Math.floor(startTimeNumber)}:30 AM`;
  } else {
    final =
      Math.floor(startTimeNumber) >= 12
        ? `${
            Math.floor(endTimeNumber) !== 12
              ? Math.floor(endTimeNumber) - 12
              : Math.floor(endTimeNumber)
          }:00 PM`
        : `${Math.floor(startTimeNumber)}:00 AM`;
  }

  if (endTimeNumber % 1 !== 0) {
    final =
      final +
      (Math.floor(endTimeNumber) >= 12
        ? `${
            Math.floor(endTimeNumber) !== 12
              ? Math.floor(endTimeNumber) - 12
              : Math.floor(endTimeNumber)
          }:30 PM`
        : `${Math.floor(endTimeNumber)}:30 AM`);
  } else {
    final =
      final +
      "-" +
      (Math.floor(endTimeNumber) >= 12
        ? `${
            Math.floor(endTimeNumber) !== 12
              ? Math.floor(endTimeNumber) - 12
              : Math.floor(endTimeNumber)
          }:00 PM`
        : `${Math.floor(endTimeNumber)}:00 AM`);
  }
  console.log(final);
  return final;
};
