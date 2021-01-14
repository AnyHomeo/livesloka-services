const Schedule = require("../models/Scheduler.model");
const Customer = require("../models/Customer.model");
const Teacher = require("../models/Teacher.model");
const Subject = require("../models/Subject.model");
const timzone = require("../models/timeZone.model");
const date = require("date-and-time");
const allZones = require("../models/timeZone.json");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const fetch = require("node-fetch");
const SchedulerModel = require("../models/Scheduler.model");

function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
}

const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(" ");

  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};

const timeZoneNameGetter = (name) => {
  console.log(name);
  var selectedZone = allZones.filter((rec) => rec.abbr === name);
  //console.log(selectedZone);
  return selectedZone[0].utc[0];
};

const slotPreproccesor = (sluts) => {
  let slotS = sluts;

  Object.keys(slotS).map((slot) => {
    let evalstamps = [];
    if (slotS[slot].length > 0) {
      //console.log(slotS[slot]);
      if (slotS[slot].length > 1) {
        for (slotindex = 0; slotindex < slotS[slot].length; slotindex++) {
          let stamp = slotS[slot][slotindex].split("-");
          //console.log(stamp)
          for (stampIndex = 1; stampIndex < stamp.length; stampIndex++) {
            if (stamp[stampIndex].endsWith("AM")) {
              var timValue = stamp[stampIndex].split(":");
              if (timValue[1].startsWith("00")) {
                if (timValue[0].startsWith("0")) {
                  timValue[0] = timValue[0].substring(1);
                }
                evalstamps.push(timValue[0]);
              } else {
                timValue[0] = Number(timValue[0]) + 0.5;
                timValue[0] = String(timValue[0]);
                //console.log("to ", timValue)
                if (timValue[0].startsWith("0")) {
                  timValue[0] = timValue[0].substring(1);
                }
                evalstamps.push(timValue[0]);
              }
            } else if (stamp[stampIndex].endsWith("PM")) {
              var timValue = convertTime12to24(stamp[stampIndex]);
              timValue = timValue.split(":");

              if (timValue[1].startsWith("00")) {
                evalstamps.push(timValue[0]);
              } else {
                timValue[0] = Number(timValue[0]) + 0.5;
                timValue[0] = String(timValue[0]);
                evalstamps.push(timValue[0]);
              }
            }
          }
        }
      }
    }
    evalstamps = evalstamps.map((es) => Number(es));
    if (evalstamps.length > 0 && consecutive(evalstamps)) {
      console.log("ok");
      let mintime = arrayMin(evalstamps);
      let maxtime = arrayMax(evalstamps);
      let convertedStamps = covertIntToTimes([mintime, maxtime]);
      let finalStr = `${slot.toUpperCase()}-${convertedStamps[0]}-${convertedStamps[1]
        }`;
      sluts[slot] = [finalStr];
      //console.log(slots[slot]);
    }
  });
  return sluts;
};

const covertIntToTimes = (arr) => {
  return (convertedTimez = arr.map((el) => {
    if (el > 12) {
      if (String(el).endsWith(".5")) {
        el = el - 12.5;
        return `${el}:30 PM`;
      } else {
        el = el - 12;
        return `${el}:00 PM`;
      }
    } else {
      if (String(el).endsWith(".5")) {
        el = el - 0.5;
        return `${el}:30 AM`;
      } else {
        return `${el}:00 AM`;
      }
    }
  }));
};

function arrayMin(arr) {
  var len = arr.length,
    min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
}

function arrayMax(arr) {
  var len = arr.length,
    max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}

function consecutive(array) {
  var i = 2,
    d;
  while (i < array.length) {
    d = array[i - 1] - array[i - 2];
    if (Math.abs(d) === 1 && d === array[i] - array[i - 1]) {
      return false;
    }
    i++;
  }
  return true;
}

const SlotConverter = (data, timezon) => {
  data = slotPreproccesor(data);
  let slotie = [];
  let trgtName = timeZoneNameGetter(timezon);
  Object.keys(data).map((key) => {
    if (data[key].length > 0) {
      for (j = 0; j < data[key].length; j++) {
        let temp = data[key][j].split("-");

        if (temp[0] === "MONDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 11 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 11 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else if (temp[0] === "TUESDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 12 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 12 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else if (temp[0] === "WEDNESDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 13 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 13 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else if (temp[0] === "THURSDAY") {
          //console.log(":what")
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 14 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 14 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            }
          }
        } else if (temp[0] === "FRIDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 15 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 15 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else if (temp[0] === "SATURDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 16 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 16 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 17 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 17 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = date.format(tim, "dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        }
      }
    }
  });
  return slotie;
};

const postProcess = (data, cn) => {
  let schdarr = [];
  let schd = "";
  console.log("from postprocess", data);
  for (q = 0; q < data.length;) {
    schd = data[q] + "to " + data[q + 1].slice(-9);
    q = q + 2;
    schdarr.push(schd);
  }
  var schString = schdarr.join(" and ");
  schString = ` ${cn}  ${schString}`;
  return schString;
};

const scheduleDescriptionGenerator = (dataSlots) => {
  dataslots = slotPreproccesor(dataSlots);
  let scheduleDes = "Attend meeting every";
  Object.keys(dataSlots).map((ds) => {
    if (dataSlots[ds].length > 0) {
      scheduleDes = scheduleDes + " " + "(" + dataSlots[ds] + ")";
    }
  });
  return scheduleDes;
};

exports.addSchedule = async (req, res) => {
  let {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    meetingLink,
    meetingAccount,
    teacher,
    students,
    demo,
    OneToOne,
    OneToMany,
    startDate,
    subject,
    classname,
  } = req.body;
  console.log(req.body);

  let slotees = {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  };
  monday = monday ? monday : [];
  tuesday = tuesday ? tuesday : [];
  wednesday = wednesday ? wednesday : [];
  thursday = thursday ? thursday : [];
  friday = friday ? friday : [];
  saturday = saturday ? saturday : [];
  sunday = sunday ? sunday : [];
  let className = "";
  meetingLink = meetingLink.startsWith("http")
    ? meetingLink
    : "https://" + meetingLink;
  try {
    let selectedSubject = await Subject.findOne({ _id: subject }).lean();
    let selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
    if (classname) {
      className = classname;
    } else {
      className = `${selectedSubject.subjectName} ${selectedTeacher.TeacherName
        } ${startDate} ${demo ? "Demo" : ""}`;
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Can't Add className",
    });
  }
  let scheduleDescription = scheduleDescriptionGenerator(slotees);

  const schedule = new Schedule({
    meetingAccount,
    meetingLink,
    teacher,
    students,
    startDate,
    slots: {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    },
    demo,
    OneToOne,
    OneToMany,
    className,
    subject,
    scheduleDescription,
  });
  schedule
    .save()
    .then((scheduledData) => {
      let allSlots = [
        ...monday,
        ...tuesday,
        ...wednesday,
        ...thursday,
        ...friday,
        ...saturday,
        ...sunday,
      ];

      ZoomAccountModel.findById(meetingAccount).then(
        async (zoomAccountData) => {
          zoomAccountData.timeSlots = [
            ...zoomAccountData.timeSlots,
            ...allSlots,
          ];
          try {
            await zoomAccountData.save();
          } catch (error) {
            console.log(error);
            return res.status(500).json({
              error: "error in saving zoom account",
            });
          }
        }
      );

      let Subjectname = "";
      Subject.findOne({ _id: scheduledData.subject })
        .then((subject) => {
          Subjectname = Subjectname + subject.subjectName;
        })
        .catch((error) => {
          console.log(error);
        });

      for (x = 0; x < students.length; x++) {
        Customer.findOne({ _id: students[x] })
          .then((data) => {
            let stud_id = data._id;
            let { timeZoneId } = data;
            timzone
              .findOne({ id: timeZoneId })
              .then(async (dat) => {
                let rec = SlotConverter(scheduledData.slots, dat.timeZoneName);
                let schdDescription = postProcess(rec, Subjectname);

                await Customer.updateOne(
                  { _id: stud_id },
                  {
                    $set: { scheduleDescription: schdDescription, meetingLink },
                    $inc: { numberOfClassesBought: demo ? 1 : 0 },
                  }
                );
              })
              .catch((err) => {
                console.log(err);
              }); // error in fetching the timezones from database
          })
          .catch((error) => {
            console.log(error);
          }); // error in fetching the students from DB
      }

      Teacher.findOne({ id: teacher }).then((data) => {
        if (data) {
          let { availableSlots } = data;
          if (availableSlots) {
            Object.keys(scheduledData.slots).forEach((day) => {
              let arr = scheduledData.slots[day];
              arr.forEach((slot) => {
                let index = availableSlots.indexOf(slot);
                data.availableSlots.splice(index, 1);
                data.scheduledSlots.push(slot);
              });
            });
          }
          data.availableSlots = [...new Set(data.availableSlots)];
          data.scheduledSlots = [...new Set(data.scheduledSlots)];
          data.save((err, docs) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                error: "error in updating teacher slots",
              });
            } else {
              return res.json({
                message: "schedule saved successfully",
              });
            }
          });
        }
      });
    })
    .catch((err) => {
      if (
        err.errors &&
        err.errors[Object.keys(err.errors)[0]].properties &&
        err.errors[Object.keys(err.errors)[0]].properties.message
      ) {
        return res.status(500).json({
          error: err.errors[Object.keys(err.errors)[0]].properties.message,
        });
      }
      console.log(err);
      return res.status(500).json({
        error: "Error in saving the schedule",
      });
    });
};

exports.editSchedule = async (req, res) => {
  const { id } = req.params;
  let {
    teacher,
    students,
    startDate,
    slots,
    demo,
    subject,
    className,
    meetingAccount,
    OneToOne,
    oneToMany
  } = req.body;

  console.log(req.body)

  let {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  } = req.body.slots;

  let slotschange = {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  };

  try {
    let selectedSubject = await Subject.findOne({ _id: subject }).lean();
    let selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
    if (className) {
      req.body.className = className;
    } else {
      req.body.className = `${selectedSubject.subjectName} ${selectedTeacher.TeacherName
        } ${startDate} ${demo ? "Demo" : ""}`;
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Can't Add className",
    });
  }
  let scheduleDescription = scheduleDescriptionGenerator(slotschange);

  ZoomAccountModel.findById(meetingAccount, async (err, data) => {
    if (err) {
      console.log(err);
    }
    const oldSchedule = await Schedule.findOne({ _id: id });

    // let slotsToCheckfromOldSchedule = oldSchedule.slots.map((slotDay) =>
    //   slotDay.sort()
    // );
    // let slotsToCheckFromNewSchedule = slotschange.map((slotDay) =>
    //   slotDay.sort()
    // );
    // if (!equal(slotsToCheckfromOldSchedule, slotsToCheckFromNewSchedule)) {
    let {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = oldSchedule.slots;
    let allSlots = [
      ...monday,
      ...tuesday,
      ...wednesday,
      ...thursday,
      ...friday,
      ...saturday,
      ...sunday,
    ];

    allSlots.forEach((slot) => {
      let slotIndex = data.timeSlots.indexOf(slot);
      if (slotIndex != -1) {
        data.timeSlots.splice(slotIndex, 1);
      }
    });
    data.save().then(async (updatedAccount) => {
      let {
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
      } = slots;
      let availableZoomAccount = await ZoomAccountModel.findOne({
        timeSlots: {
          $nin: [
            ...monday,
            ...tuesday,
            ...wednesday,
            ...thursday,
            ...friday,
            ...saturday,
            ...sunday,
          ],
        },
      });
      if (!availableZoomAccount) {
        return res.status(400).json({
          error: "No zoom account available for this Slots",
        });
      }
      console.log(availableZoomAccount);
      const { _id, zoomEmail, zoomJwt, zoomPassword } = availableZoomAccount;
      console.log(_id);
      const { meetingLink } = oldSchedule;
      console.log(
        meetingLink,
        meetingLink.split("/"),
        meetingLink.split("/")[4].split("?")[0]
      );
      fetch(
        `https://api.zoom.us/v2/meetings/${meetingLink.split("/")[4].split("?")[0]
        }`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${zoomJwt}`,
          },
        }
      )
        .then((res) => {
          console.log(res);
        })
        .catch((Err) => {
          console.log(Err);
        });
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
      fetch(`https://api.zoom.us/v2/users/${zoomEmail}/meetings`, {
        method: "post",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${zoomJwt}`,
        },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.code === 1001) {
            return res.status(400).json({
              message: "Error while creating meeting link",
            });
          }
          req.body.meetingLink = json.join_url;
          req.body.meetingAccount = _id;
        });
      // }
      Schedule.updateOne(
        { _id: id },
        { ...req.body, scheduleDescription },
        (err, response) => {

          if (err) {
            return res.status(500).json({
              error: "Error in updating schedule",
            });
          }
          ZoomAccountModel.findById(_id)
            .then(async (data) => {
              data.timeSlots = [
                ...data.timeSlots,
                ...monday,
                ...tuesday,
                ...wednesday,
                ...thursday,
                ...friday,
                ...saturday,
                ...sunday,
              ];
              await data.save();
            })
            .catch((err) => {
              console.log(err);
            });
          let Subjectname = "";
          Subject.findOne({ _id: subject })
            .then((subject) => {
              Subjectname = Subjectname + subject.subjectName;
            })
            .catch((error) => {
              console.log(error);
            });
          for (x = 0; x < students.length; x++) {
            Customer.findOne({ _id: students[x] })
              .then((data) => {
                let stud_id = data._id;
                let { timeZoneId } = data;

                timzone
                  .findOne({ id: timeZoneId })
                  .then(async (dat) => {
                    let rec = SlotConverter(slots, dat.timeZoneName);
                    let schdDescription = postProcess(rec, Subjectname);
                    await Customer.updateOne(
                      { _id: stud_id },
                      {
                        $set: {
                          scheduleDescription: schdDescription,
                          meetingLink: json.join_url,
                        },
                      }
                    );
                  })
                  .catch((err) => {
                    console.log(err);
                  }); // error in fetching the timezones from database
              })
              .catch((error) => {
                console.log(error);
                //return res.status(400).json({ msg: "error in updating students Links and Description", err });
              }); // error in fetching the students from DB
          }
          Teacher.findOne({ id: teacher })
            .then((data) => {
              if (data) {
                let { availableSlots } = data;
                if (availableSlots) {
                  Object.keys(slots).forEach((day) => {
                    let arr = slots[day];
                    arr.forEach((slot) => {
                      let index = availableSlots.indexOf(slot);
                      if (index != -1) {
                        data.availableSlots.splice(index, 1);
                      }
                      data.scheduledSlots.push(slot);
                    });
                  });
                }
                data.availableSlots = [...new Set(data.availableSlots)];
                data.scheduledSlots = [...new Set(data.scheduledSlots)];
                data.save((err, docs) => {
                  if (err) {
                    console.log(err);
                    return res.status(500).json({
                      error: "error in updating teacher slots",
                    });
                  } else {
                    return res.json({
                      message: "schedule updated successfully",
                    });
                  }
                });
              }
            })
            .catch((err) => {
              console.log(err);
              return res.status(400).json({
                error: "error in updating students Links and Description",
              });
            });
        }
      );
    });
  });
};
exports.deleteScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    let schedule = await Schedule.findById(id);
    let teacherOfSchedule = await Teacher.findOne({ id: schedule.teacher });
    const {
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = schedule.slots;
    let slotsOfSchedule = monday
      .concat(tuesday)
      .concat(wednesday)
      .concat(thursday)
      .concat(friday)
      .concat(saturday)
      .concat(sunday);
    teacherOfSchedule.availableSlots = teacherOfSchedule.availableSlots.concat(
      slotsOfSchedule
    );
    teacherOfSchedule.availableSlots = [
      ...new Set(teacherOfSchedule.availableSlots),
    ];
    teacherOfSchedule.scheduledSlots = teacherOfSchedule.scheduledSlots.filter(
      (slot) => !slotsOfSchedule.includes(slot)
    );
    const { meetingAccount, meetingLink } = schedule;
    const meetingAccountData = await ZoomAccountModel.findById(meetingAccount);

    fetch(
      `https://api.zoom.us/v2/meetings/${meetingLink.split("/")[4].split("?")[0]
      }`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${meetingAccountData.zoomJwt}`,
        },
      }
    )
      .then((res) => {
        console.log(res);
      })
      .catch((Err) => {
        console.log(Err);
      });
    const ZoomAccountDetails = await ZoomAccountModel.findById(meetingAccount);
    slotsOfSchedule.forEach((slot) => {
      let slotIndex = ZoomAccountDetails.timeSlots.indexOf(slot);
      if (slotIndex != -1) {
        ZoomAccountDetails.timeSlots.splice(slotIndex, 1);
      }
    });
    await ZoomAccountDetails.save();

    teacherOfSchedule.save((err, docs) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "error in updating teacher",
        });
      }
      schedule.isDeleted = true;
      schedule.save((err, deletedSchedule) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            error: "error in updating teacher",
          });
        }
        return res.status(200).json({
          message: "Schedule Deleted Successfully",
        });
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in Deleting Schedule",
    });
  }
};

exports.getScheduleById = (req, res) => {
  const { id } = req.params;
  Schedule.findById(id)
    .populate("students", "firstName lastName")
    .then((data) => {
      return res.status(200).json({
        message: "Schedule Retrieved Successfully",
        result: data,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: "Internal server error",
        result: null,
      });
    });
};

exports.getAllSchedules = (req, res) => {
  let { params } = req.query;
  params = params ? params.split(",").join(" ") : "";
  Schedule.find({
    isDeleted: false,
  })
    .select(params)
    .then((allSchedules) => {
      return res.json({
        result: allSchedules,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error: "Internal Server error",
      });
    });
};

exports.getAllSchedulesByZoomAccountId = async (req, res) => {
  try {
    const { id } = req.params;
    const schedules = await SchedulerModel.find({
      meetingAccount: id,
      isDeleted: { $ne: true },
    });
    return res.json({
      result: schedules,
      message: "Schedules retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error in retreiving data",
    });
  }
};

exports.getAllScheduleswithZoomAccountSorted = async (req, res) => {
  try {
    const { day } = req.query;
    const schedules = await SchedulerModel.find({
      isDeleted: { $ne: true },
      ["slots." + day + ".0"]: { $exists: true },
    })
      .sort({ meetingAccount: -1 })
      .select("meetingAccount className slots." + day)
      .lean();

    const allZoomAccounts = await ZoomAccountModel.find()
      .select("color ZoomAccountName")
      .lean();

    let finalSortedData = {};
    allZoomAccounts.forEach((zoomAccount) => {
      finalSortedData[zoomAccount.ZoomAccountName] = {};
      finalSortedData[zoomAccount.ZoomAccountName] = {
        ...zoomAccount,
        schedules: [],
      };
      schedules.forEach((schedule) => {
        if (schedule.meetingAccount.toString() === zoomAccount._id.toString()) {
          schedule.slots = schedule.slots[day];
          finalSortedData[zoomAccount.ZoomAccountName].schedules.push(schedule);
        }
      });
    });

    return res.json({
      message: "Everything is cool",
      result: finalSortedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
};
