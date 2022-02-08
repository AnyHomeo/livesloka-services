require("dotenv").config();
const Schedule = require("../models/Scheduler.model");
const Attendance = require("../models/Attendance");
const Customer = require("../models/Customer.model");
const Teacher = require("../models/Teacher.model");
const Subject = require("../models/Subject.model");
const timzone = require("../models/timeZone.model");
const allZones = require("../models/timeZone.json");
const ZoomAccountModel = require("../models/ZoomAccount.model");
const fetch = require("node-fetch");
const SchedulerModel = require("../models/Scheduler.model");
const TeacherModel = require("../models/Teacher.model");
var equal = require("fast-deep-equal");
const moment = require("moment");
const momentTZ = require("moment-timezone");
const Payments = require("../models/Payments");
const ClassHistoryModel = require("../models/ClassHistory.model");
const times = require("../models/times.json");
const CancelledClassesModel = require("../models/CancelledClasses.model");
const CustomerModel = require("../models/Customer.model");
const { sendSMS } = require("../config/helper");
const { getDemoMessage } = require("../config/helper");

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
  var selectedZone = allZones.filter((rec) => rec.abbr === name);
  return selectedZone[0].utc[0];
};

const slotPreproccesor = (sluts) => {
  let slotS = sluts;

  Object.keys(slotS).map((slot) => {
    let evalstamps = [];
    if (slotS[slot].length > 0) {
      if (slotS[slot].length > 1) {
        for (slotindex = 0; slotindex < slotS[slot].length; slotindex++) {
          let stamp = slotS[slot][slotindex].split("-");
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
      let mintime = arrayMin(evalstamps);
      let maxtime = arrayMax(evalstamps);
      let convertedStamps = covertIntToTimes([mintime, maxtime]);
      let finalStr = `${slot.toUpperCase()}-${convertedStamps[0]}-${
        convertedStamps[1]
      }`;
      sluts[slot] = [finalStr];
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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 11 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");
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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 12 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");

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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 13 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");

              slotie.push(d);
            }
          }
        } else if (temp[0] === "THURSDAY") {
          for (k = 1; k < temp.length; k++) {
            if (temp[k].endsWith("AM")) {
              let tim = convertTZ(
                `Jan 14 2021 ${temp[k]} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 14 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");
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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 15 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");

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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 16 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");

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
              let d = moment(tim).format("dddd-hh:mm A ");
              slotie.push(d);
            } else {
              let ti = convertTime12to24(temp[k]);
              let tim = convertTZ(
                `Jan 17 2021 ${ti} GMT+0530 (India Standard Time)`,
                trgtName
              );
              let d = moment(tim).format("dddd-hh:mm A ");

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
  for (q = 0; q < data.length; ) {
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
    isZoomMeeting,
    isSummerCampClass,
    summerCampAmount,
    summerCampTitle,
    summerCampDescription,
    summerCampSchedule,
    summerCampImage,
    summerCampStudentsLimit,
    summerCampClassNumberOfDays,
  } = req.body;

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
  let wherebyMeetingId = undefined;
  let wherebyHostUrl = undefined;
  if (isZoomMeeting) {
    meetingLink = meetingLink.startsWith("http")
      ? meetingLink
      : "https://" + meetingLink;
  } else {
    try {
      const data = {
        startDate: moment().format(),
        endDate: moment().add(1, "year").format(),
        roomMode: "group",
        roomNamePattern: "human-short",
        fields: ["hostRoomUrl"],
      };
      meetingLinkData = await fetch("https://api.whereby.dev/v1/meetings", {
        method: "post",
        headers: {
          Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
          "Content-type": "application/json",
          Accept: "application/json",
          "Accept-Charset": "utf-8",
        },
        body: JSON.stringify(data),
      });
      meetingLinkData = await meetingLinkData.json();
      wherebyMeetingId = meetingLinkData.meetingId;
      wherebyHostUrl = meetingLinkData.hostRoomUrl;
      meetingLink = meetingLinkData.roomUrl;
    } catch (error) {
      console.log(error);
      return res.status(500).json("Error in Whereby Meeting Generation");
    }
  }
  try {
    let selectedSubject = await Subject.findOne({ _id: subject }).lean();
    var selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
    if (classname) {
      className = classname;
    } else {
      className = `${selectedSubject.subjectName} ${
        selectedTeacher.TeacherName
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
    wherebyHostUrl,
    wherebyMeetingId,
    isZoomMeeting,
    isSummerCampClass,
    summerCampAmount,
    summerCampTitle,
    summerCampDescription,
    summerCampSchedule,
    summerCampImage,
    summerCampStudentsLimit,
    summerCampClassNumberOfDays,
  });
  schedule
    .save()
    .then(async (scheduledData) => {
      let allSlots = [
        ...monday,
        ...tuesday,
        ...wednesday,
        ...thursday,
        ...friday,
        ...saturday,
        ...sunday,
      ];
      if (isZoomMeeting) {
        ZoomAccountModel.findById(meetingAccount)
          .then(async (zoomAccountData) => {
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
          })
          .catch((err) => {
            console.log(err);
          });
      }

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
          .then(async (data) => {
            let stud_id = data._id;
            let { timeZoneId } = data;
            timzone
              .findOne({ id: timeZoneId })
              .then(async (dat) => {
                let rec = SlotConverter(scheduledData.slots, dat.timeZoneName);
                let schdDescription = postProcess(rec, Subjectname);
                let previousValue = data.numberOfClassesBought;
                let nextValue = demo
                  ? data.numberOfClassesBought + 1
                  : data.numberOfClassesBought;
                if (previousValue !== nextValue) {
                  let newUpdate = new ClassHistoryModel({
                    previousValue,
                    nextValue,
                    comment: "Scheduled a Demo class",
                    customerId: stud_id,
                  });
                  await newUpdate.save();
                }
                await Customer.updateOne(
                  { _id: stud_id },
                  {
                    $set: {
                      scheduleDescription: schdDescription,
                      meetingLink,
                      teacherId: selectedTeacher.id,
                      classStatusId: demo
                        ? "38493085684944"
                        : "121975682530440",
                    },
                    numberOfClassesBought: demo
                      ? data.numberOfClassesBought + 1
                      : data.numberOfClassesBought,
                  }
                );
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((error) => {
            console.log(error);
          });
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
  try {
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
      isMeetingLinkChangeNeeded,
    } = req.body;

    let slotschange = {
      monday: req.body.slots.monday,
      tuesday: req.body.slots.tuesday,
      wednesday: req.body.slots.wednesday,
      thursday: req.body.slots.thursday,
      friday: req.body.slots.friday,
      saturday: req.body.slots.saturday,
      sunday: req.body.slots.sunday,
    };

    try {
      let selectedSubject = await Subject.findOne({ _id: subject }).lean();
      var selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
      if (className) {
        req.body.className = className;
      } else {
        req.body.className = `${selectedSubject.subjectName} ${
          selectedTeacher.TeacherName
        } ${startDate} ${demo ? "Demo" : ""}`;
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        error: "Can't Add className",
      });
    }

    let scheduleDescription = scheduleDescriptionGenerator(slotschange);
    const oldSchedule = await Schedule.findOne({ _id: id }).lean();
    let oldTeacher = await TeacherModel.findOne({ id: oldSchedule.teacher });

    let oldScheduleSlots = Object.keys(oldSchedule.slots).map((day) =>
      oldSchedule.slots[day].sort()
    );
    let newSlots = Object.keys(slots).map((day) => slots[day].sort());
    let isNewMeetingLinkNeeded =
      !equal(oldScheduleSlots, newSlots) || isMeetingLinkChangeNeeded;
    let { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      oldSchedule.slots;
    let allSlots = [
      ...monday,
      ...tuesday,
      ...wednesday,
      ...thursday,
      ...friday,
      ...saturday,
      ...sunday,
    ];
    let newStudents = students
      .filter(
        (student) =>
          !oldSchedule.students.filter((oldStudent) =>
            oldStudent.equals(student)
          ).length
      )
      .map((student) => student.toString());

    oldTeacher.availableSlots = oldTeacher.availableSlots.concat(allSlots);
    oldTeacher.availableSlots = [...new Set(oldTeacher.availableSlots)];
    let allScheduledSlotsOfTeacher = [...oldTeacher.scheduledSlots];
    allScheduledSlotsOfTeacher.forEach((slot) => {
      if (allSlots.includes(slot)) {
        let index = oldTeacher.scheduledSlots.indexOf(slot);
        oldTeacher.scheduledSlots.splice(index, 1);
      }
    });

    await oldTeacher.save();
    if (isNewMeetingLinkNeeded) {
      ZoomAccountModel.findOne(
        { _id: meetingAccount, isDisabled: { $ne: true } },
        async (err, data) => {
          if (err) {
            console.log(err);
          }
          if (data) {
            allSlots.forEach((slot) => {
              let slotIndex = data.timeSlots.indexOf(slot);
              if (slotIndex != -1) {
                data.timeSlots.splice(slotIndex, 1);
              }
            });
            await data.save();
          }

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
            throw Error("no Zoom Account!");
          }
          const { _id, zoomEmail, zoomJwt, zoomPassword } =
            availableZoomAccount;
          const { meetingLink } = oldSchedule;
          if (meetingLink && meetingLink.includes("zoom")) {
            await fetch(
              `https://api.zoom.us/v2/meetings/${
                meetingLink.split("/")[4].split("?")[0]
              }`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${zoomJwt}`,
                },
              }
            );
          }
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
              Schedule.updateOne(
                { _id: id },
                { ...req.body, scheduleDescription },
                (err, response) => {
                  if (err) {
                    return res.status(500).json({
                      error: "Error in updating schedule",
                    });
                  }
                  ZoomAccountModel.findById(req.body.meetingAccount)
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

                      await ZoomAccountModel.updateOne(
                        { _id: req.body.meetingAccount },
                        { timeSlots: data.timeSlots }
                      );
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
                            let anyPayments = await Payments.countDocuments({
                              customerId: data._id,
                            });
                            let previousValue = data.numberOfClassesBought;
                            let nextValue =
                              (demo &&
                                newStudents.includes(stud_id.toString())) ||
                              (demo && !oldSchedule.demo)
                                ? data.numberOfClassesBought + 1
                                : data.numberOfClassesBought;
                            if (previousValue !== nextValue) {
                              let newUpdate = new ClassHistoryModel({
                                previousValue,
                                nextValue,
                                comment: "Scheduled a Demo class",
                                customerId: stud_id,
                              });
                              await newUpdate.save();
                            }
                            await Customer.updateOne(
                              { _id: stud_id },
                              {
                                $set: {
                                  scheduleDescription: schdDescription,
                                  meetingLink: req.body.meetingLink,
                                  teacherId: selectedTeacher.id,
                                  numberOfClassesBought:
                                    (demo &&
                                      newStudents.includes(
                                        stud_id.toString()
                                      )) ||
                                    (demo && !oldSchedule.demo)
                                      ? data.numberOfClassesBought + 1
                                      : data.numberOfClassesBought,
                                  classStatusId: demo
                                    ? "38493085684944"
                                    : anyPayments
                                    ? "113975223750050"
                                    : "121975682530440",
                                },
                              }
                            );
                          })
                          .catch((err) => {
                            console.log(err);
                          });
                      })
                      .catch((error) => {
                        console.log(error);
                      });
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
                        error:
                          "error in updating students Links and Description",
                      });
                    });
                }
              );
            });
        }
      );
    } else {
      Schedule.updateOne(
        { _id: id },
        { ...req.body, scheduleDescription },
        (err, response) => {
          if (err) {
            return res.status(500).json({
              error: "Error in updating schedule",
            });
          }
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
                    let anyPayments = await Payments.countDocuments({
                      customerId: data._id,
                      status: "SUCCESS",
                    });
                    let previousValue = data.numberOfClassesBought;
                    let nextValue =
                      (demo && newStudents.includes(stud_id.toString())) ||
                      (demo && !oldSchedule.demo)
                        ? data.numberOfClassesBought + 1
                        : data.numberOfClassesBought;
                    if (previousValue !== nextValue) {
                      let newUpdate = new ClassHistoryModel({
                        previousValue,
                        nextValue,
                        comment: "Scheduled a Demo class",
                        customerId: stud_id,
                      });
                      await newUpdate.save();
                    }
                    await Customer.updateOne(
                      { _id: stud_id },
                      {
                        $set: {
                          scheduleDescription: schdDescription,
                          meetingLink: req.body.meetingLink,
                          teacherId: selectedTeacher.id,
                          numberOfClassesBought:
                            (demo &&
                              newStudents.includes(stud_id.toString())) ||
                            (demo && !oldSchedule.demo)
                              ? data.numberOfClassesBought + 1
                              : data.numberOfClassesBought,
                          classStatusId: demo
                            ? "38493085684944"
                            : anyPayments
                            ? "113975223750050"
                            : "121975682530440",
                        },
                      }
                    );
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              })
              .catch((error) => {
                console.log(error);
              });
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
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Zoom not available",
    });
  }
};

exports.deleteScheduleById = async (req, res) => {
  const { id } = req.params;
  try {
    let schedule = await Schedule.findById(id);
    let { students } = schedule;
    let teacherOfSchedule = await Teacher.findOne({ id: schedule.teacher });
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      schedule.slots;
    let slotsOfSchedule = monday
      .concat(tuesday)
      .concat(wednesday)
      .concat(thursday)
      .concat(friday)
      .concat(saturday)
      .concat(sunday);
    teacherOfSchedule.availableSlots =
      teacherOfSchedule.availableSlots.concat(slotsOfSchedule);
    teacherOfSchedule.availableSlots = [
      ...new Set(teacherOfSchedule.availableSlots),
    ];
    teacherOfSchedule.scheduledSlots = teacherOfSchedule.scheduledSlots.filter(
      (slot) => !slotsOfSchedule.includes(slot)
    );
    const { meetingAccount, meetingLink, isZoomMeeting } = schedule;
    const meetingAccountData = await ZoomAccountModel.findById(meetingAccount);
    if (meetingAccountData && isZoomMeeting && meetingLink.includes("zoom")) {
      await fetch(
        `https://api.zoom.us/v2/meetings/${
          meetingLink.split("/")[4].split("?")[0]
        }`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${meetingAccountData.zoomJwt}`,
          },
        }
      );
    }

    if (isZoomMeeting) {
      const ZoomAccountDetails = await ZoomAccountModel.findById(
        meetingAccount
      );
      if (ZoomAccountDetails) {
        slotsOfSchedule.forEach((slot) => {
          let slotIndex = ZoomAccountDetails.timeSlots.indexOf(slot);
          if (slotIndex != -1) {
            ZoomAccountDetails.timeSlots.splice(slotIndex, 1);
          }
        });
        await ZoomAccountDetails.save();
      }
    }
    teacherOfSchedule.save((err, docs) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "error in updating teacher",
        });
      }
      schedule.isDeleted = true;
      schedule.lastTimeJoinedClass = undefined;
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
    .populate(
      "students",
      "firstName lastName phone whatsAppnumber meetingLink email numberOfClassesBought"
    )
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
    isDeleted: {
      $ne: true,
    },
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
      .select("color ZoomAccountName isDisabled")
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
      message: "Zoom accounts retrieved successfully",
      result: finalSortedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
};

exports.dangerousScheduleUpdate = async (req, res) => {
  const { message } = req.query;
  try {
    const { scheduleId } = req.params;
    let updatedSchedule = await SchedulerModel.updateOne(
      { _id: scheduleId },
      { ...req.body }
    );
    return res.json({
      message: message ? message + " successful" : "Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: message ? message + " failed" : "Internal Server Error",
    });
  }
};

exports.editIfWhereby = async (req, res, next) => {
  if (req.body.isZoomMeeting) {
    next();
  } else {
    try {
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
        isMeetingLinkChangeNeeded,
        isZoomMeeting,
      } = req.body;

      req.body.meetingAccount = meetingAccount ? meetingAccount : null;

      let slotschange = {
        monday: req.body.slots.monday,
        tuesday: req.body.slots.tuesday,
        wednesday: req.body.slots.wednesday,
        thursday: req.body.slots.thursday,
        friday: req.body.slots.friday,
        saturday: req.body.slots.saturday,
        sunday: req.body.slots.sunday,
      };

      try {
        let selectedSubject = await Subject.findOne({ _id: subject }).lean();
        var selectedTeacher = await Teacher.findOne({ id: teacher }).lean();
        if (className) {
          req.body.className = className;
        } else {
          req.body.className = `${selectedSubject.subjectName} ${
            selectedTeacher.TeacherName
          } ${startDate} ${demo ? "Demo" : ""}`;
        }
      } catch (error) {
        console.log(error);
        return res.status(400).json({
          error: "Can't Add className",
        });
      }
      let scheduleDescription = scheduleDescriptionGenerator(slotschange);
      req.body.scheduleDescription = scheduleDescription;
      const oldSchedule = await Schedule.findOne({ _id: id }).lean();
      let oldTeacher = await TeacherModel.findOne({ id: oldSchedule.teacher });
      let { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
        oldSchedule.slots;
      let allSlots = [
        ...monday,
        ...tuesday,
        ...wednesday,
        ...thursday,
        ...friday,
        ...saturday,
        ...sunday,
      ];
      oldTeacher.availableSlots = oldTeacher.availableSlots.concat(allSlots);
      oldTeacher.availableSlots = [...new Set(oldTeacher.availableSlots)];
      let allScheduledSlotsOfTeacher = [...oldTeacher.scheduledSlots];
      allScheduledSlotsOfTeacher.forEach((slot) => {
        if (allSlots.includes(slot)) {
          let index = oldTeacher.scheduledSlots.indexOf(slot);
          oldTeacher.scheduledSlots.splice(index, 1);
        }
      });
      await oldTeacher.save();

      if (isMeetingLinkChangeNeeded || oldSchedule.isZoomMeeting) {
        if (oldSchedule.isZoomMeeting) {
          ZoomAccountModel.findById(oldSchedule.meetingAccount)
            .then(async (data) => {
              if (data) {
                allSlots.forEach((slot) => {
                  let slotIndex = data.timeSlots.indexOf(slot);
                  if (slotIndex != -1) {
                    data.timeSlots.splice(slotIndex, 1);
                  }
                });
                if (data.zoomJwt) {
                  await fetch(
                    `https://api.zoom.us/v2/meetings/${
                      oldSchedule.meetingLink.split("/")[4].split("?")[0]
                    }`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.zoomJwt}`,
                      },
                    }
                  );
                }
              }
              await data.save();
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          let deletedMeeting = await fetch(
            "https://api.whereby.dev/v1/meetings/" +
              oldSchedule.wherebyMeetingId,
            {
              method: "delete",
              headers: {
                Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
                "Content-type": "application/json",
                Accept: "application/json",
                "Accept-Charset": "utf-8",
              },
            }
          );
          deletedMeeting = await deletedMeeting.json();
        }
        const data = {
          startDate: moment().format(),
          endDate: moment().add(1, "year").format(),
          roomMode: "group",
          roomNamePattern: "human-short",
          fields: ["hostRoomUrl"],
        };
        let meetingLinkData = await fetch(
          "https://api.whereby.dev/v1/meetings",
          {
            method: "post",
            headers: {
              Authorization: `Bearer ${process.env.WHEREBY_API_KEY}`,
              "Content-type": "application/json",
              Accept: "application/json",
              "Accept-Charset": "utf-8",
            },
            body: JSON.stringify(data),
          }
        );
        meetingLinkData = await meetingLinkData.json();
        req.body.wherebyMeetingId = meetingLinkData.meetingId;
        req.body.wherebyHostUrl = meetingLinkData.hostRoomUrl;
        req.body.meetingLink = meetingLinkData.roomUrl;
        await SchedulerModel.updateOne(
          {
            _id: id,
          },
          { ...req.body }
        );

        students.forEach(async (student) => {
          let anyPayments = await Payments.countDocuments({
            customerId: student,
          });
          await Customer.updateOne(
            { _id: student },
            {
              $set: {
                meetingLink: req.body.meetingLink,
                teacherId: selectedTeacher.id,
                classStatusId: demo
                  ? "38493085684944"
                  : anyPayments
                  ? "113975223750050"
                  : "121975682530440",
              },
            }
          );
        });
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
            return res.status(500).json({
              error: "Error in updating slots of teachers",
            });
          });
      } else {
        await SchedulerModel.updateOne(
          {
            _id: id,
          },
          { ...req.body }
        );

        students.forEach(async (student) => {
          let anyPayments = await Payments.countDocuments({
            customerId: student,
          });
          await Customer.updateOne(
            { _id: student },
            {
              $set: {
                meetingLink: req.body.meetingLink,
                teacherId: selectedTeacher.id,
                classStatusId: demo
                  ? "38493085684944"
                  : anyPayments
                  ? "113975223750050"
                  : "121975682530440",
              },
            }
          );
        });
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
            return res.status(500).json({
              error: "Error in updating slots of teachers",
            });
          });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error in editing Schedule",
      });
    }
  }
};

exports.changeZoomLink = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    let schedule = await SchedulerModel.findById(scheduleId);
    const { meetingLink, meetingAccount } = schedule;

    let { monday, tuesday, wednesday, thursday, friday, saturday, sunday } =
      schedule.slots;
    let allSlots = [
      ...monday,
      ...tuesday,
      ...wednesday,
      ...thursday,
      ...friday,
      ...saturday,
      ...sunday,
    ];


    let availableZoomAccount = await ZoomAccountModel.findOne({
      timeSlots: {
        $nin: allSlots,
      },
    });

    // check if any other zoom account was available
    if (!availableZoomAccount) {
      return res.status(404).json({ message: "No zoom account available" });
    }


    // Remove from old zoom link
    let oldZoomAccount = await ZoomAccountModel.findOne({
      _id: meetingAccount,
      isDisabled: { $ne: true },
    });
    if (oldZoomAccount) {
      allSlots.forEach((slot) => {
        let slotIndex = oldZoomAccount.timeSlots.indexOf(slot);
        if (slotIndex != -1) {
          oldZoomAccount.timeSlots.splice(slotIndex, 1);
        }
      });
      await oldZoomAccount.save();
      // delete existing zoom link
      if (meetingLink && meetingLink.toLowerCase().includes("zoom")) {
        await fetch(
          `https://api.zoom.us/v2/meetings/${
            meetingLink.split("/")[4].split("?")[0]
          }`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${oldZoomAccount.zoomJwt}`,
            },
          }
        );
      }
    }

    const { zoomJwt, zoomEmail, zoomPassword } = availableZoomAccount;

    // create new zoomlink
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
    let data = await fetch(
      `https://api.zoom.us/v2/users/${zoomEmail}/meetings`,
      {
        method: "post",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${zoomJwt}`,
        },
      }
    );
    let response = await data.json();
    schedule.meetingAccount = availableZoomAccount._id
    schedule.meetingLink = response.join_url;
    await schedule.save();
    await ZoomAccountModel.updateOne(
      { _id: availableZoomAccount._id },
      { timeSlots: [...availableZoomAccount.timeSlots, ...allSlots] }
    );
    return res.status(200).json({
      message: "Meeting Link Updated successfully!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
};

exports.getSchedulesByScheduleIdAndTime = (req, res) => {
  const { scheduleId, date } = req.params;
  let month = parseInt(date.split("-")[1]) - 1;
  let year = date.split("-")[0];
  Attendance.find({
    scheduleId,
    createdAt: {
      $gte: moment()
        .set("month", month)
        .set("year", year)
        .startOf("month")
        .format(),
      $lte: moment()
        .set("month", month)
        .set("year", year)
        .endOf("month")
        .format(),
    },
  })
    .populate("customers", "firstName email")
    .populate("requestedStudents", "firstName email")
    .populate("requestedPaidStudents", "firstName email")
    .populate("absentees", "firstName email")
    .populate("requestedPaidStudents", "firstName email")
    .then((data) => {
      return res.json({
        message: "Attendance retrieved successfully",
        result: data,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: "error in retrieving Attendance",
      });
    });
};

const getNextSlot = (scheduledSlots, slot, presentMeetingSlots) => {
  let day = slot.split("-")[0].toUpperCase();
  let slotWithoutDay = slot.split("-")[1] + "-" + slot.split("-")[2];
  let index = times.indexOf(slotWithoutDay);
  let allNextSlots = times.slice(index);
  let nextSlot = "";
  for (let i = 0; i < allNextSlots.length; i++) {
    let x = day + "-" + allNextSlots[i];
    if (scheduledSlots.includes(x) && !presentMeetingSlots.includes(x)) {
      nextSlot = x;
      break;
    }
  }
  return nextSlot;
};

exports.getPresentAndNextScheduleOfATeacher = async (req, res) => {
  try {
    const { teacherId, slot } = req.params;
    let teacher = await Teacher.findOne({ id: teacherId }).lean();
    let { scheduledSlots } = teacher;
    let day = slot.split("-")[0].toLowerCase();
    let scheduleRightNow = await SchedulerModel.findOne({
      teacher: teacherId,
      [`slots.${day}`]: {
        $in: [slot],
      },
      isDeleted: false,
    }).populate("students", "firstName");
    let nextSlot = "";
    if (scheduleRightNow) {
      nextSlot = getNextSlot(scheduledSlots, slot, scheduleRightNow.slots[day]);
    } else {
      nextSlot = getNextSlot(scheduledSlots, slot, []);
    }
    let nextSchedule = await SchedulerModel.findOne({
      teacher: teacherId,
      [`slots.${day}`]: {
        $in: [nextSlot],
      },
      isDeleted: false,
    }).populate("students", "firstName");

    let idsToNotToRetrieve = [];
    if (scheduleRightNow) {
      idsToNotToRetrieve.push(scheduleRightNow._id);
    }
    if (nextSchedule) {
      idsToNotToRetrieve.push(nextSchedule._id);
    }

    let otherSchedules = await SchedulerModel.find({
      _id: {
        $nin: idsToNotToRetrieve,
      },
      teacher: teacherId,
      ["slots." + day + ".0"]: { $exists: true },
      isDeleted: false,
    });

    let teacherSchedules = await SchedulerModel.find({
      teacher: teacherId,
    }).select("_id");

    teacherSchedules = teacherSchedules.map((schedule) => schedule._id);

    let todayLeaves = await CancelledClassesModel.find({
      scheduleId: {
        $in: teacherSchedules,
      },
      cancelledDate: {
        $gte: momentTZ().tz("Asia/Kolkata").startOf("day").format(),
        $lte: momentTZ().tz("Asia/Kolkata").endOf("day").format(),
      },
    })
      .populate("studentId", "firstName")
      .populate("scheduleId", "className");

    let tomorrowLeaves = await CancelledClassesModel.find({
      scheduleId: {
        $in: teacherSchedules,
      },
      cancelledDate: {
        $gte: momentTZ()
          .tz("Asia/Kolkata")
          .add(1, "day")
          .startOf("day")
          .format(),
        $lte: momentTZ().tz("Asia/Kolkata").add(1, "day").endOf("day").format(),
      },
    })
      .populate("studentId", "firstName")
      .populate("scheduleId", "className");

    return res.json({
      result: {
        scheduleRightNow,
        nextSchedule,
        otherSchedules,
        todayLeaves,
        tomorrowLeaves,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Something went wrong!",
    });
  }
};
